import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LinkService } from '../../../core/services/link.service';
import { Invitation } from '../../../core/models/invitation.model';
import { NotificationMode } from '../../../core/models/enums.model';

type PageState = 'loading' | 'form' | 'success' | 'error';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
<div class="join-page">

  <!-- Loading -->
  @if (state() === 'loading') {
    <div class="state-card">
      <div class="spinner"></div>
      <p class="state-text">Chargement…</p>
    </div>
  }

  <!-- Error -->
  @if (state() === 'error') {
    <div class="state-card">
      <div class="state-icon icon-error">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 class="state-title">Lien invalide</h2>
      <p class="state-sub">{{ errorMsg() }}</p>
    </div>
  }

  <!-- Form -->
  @if (state() === 'form') {
    <div class="join-card">
      <div class="join-top-band">
        <img src="/img/logo.png" class="join-logo" alt="Smart Invite" />
        <h1 class="join-title">Inscription à l'événement</h1>
        <p class="join-sub">Remplissez le formulaire pour recevoir votre invitation</p>
      </div>

      <div class="join-body">
        <form [formGroup]="form" (ngSubmit)="submit()">

          <div class="field">
            <label class="label">Nom complet <span class="req">*</span></label>
            <input formControlName="fullName" type="text" class="input"
              [class.error]="isInvalid('fullName')" placeholder="Jean Dupont" />
            @if (isInvalid('fullName')) { <p class="field-error">Requis, minimum 2 caractères</p> }
          </div>

          <div class="fields-row">
            <div class="field">
              <label class="label">Email</label>
              <input formControlName="email" type="email" class="input" placeholder="jean@exemple.com" />
            </div>
            <div class="field">
              <label class="label">Téléphone</label>
              <input formControlName="phoneNumber" type="tel" class="input" placeholder="+237 6XX XXX XXX" />
            </div>
          </div>

          <div class="field">
            <label class="label">Comment souhaitez-vous être notifié(e) ?</label>
            <div class="notif-options">
              @for (opt of notifOptions; track opt.key) {
                <label class="notif-opt" [class.selected]="form.value.notificationMode === opt.key">
                  <input type="radio" formControlName="notificationMode" [value]="opt.key" class="radio-hidden" />
                  <span class="notif-icon">{{ opt.icon }}</span>
                  <span class="notif-label">{{ opt.label }}</span>
                </label>
              }
            </div>
          </div>

          @if (submitError()) {
            <div class="error-banner">{{ submitError() }}</div>
          }

          <button type="submit" class="btn-submit" [disabled]="submitting()">
            @if (submitting()) { <span class="spinner-sm"></span> Inscription en cours… }
            @else {
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              S'inscrire et recevoir mon invitation
            }
          </button>

        </form>
      </div>

      <div class="join-bottom-band">
        <p class="join-footer-text">Smart Invite — Gestion d'invitations</p>
      </div>
    </div>
  }

  <!-- Success -->
  @if (state() === 'success' && result()) {
    <div class="join-card">
      <div class="join-top-band">
        <img src="/img/logo.png" class="join-logo" alt="Smart Invite" />
      </div>
      <div class="join-body center">
        <div class="result-icon icon-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="result-title">Inscription confirmée !</h2>
        <p class="result-sub">
          Bienvenue <strong>{{ result()!.guestName }}</strong> !
          Votre invitation a été générée avec succès.
        </p>

        @if (result()!.qrCodeUrl) {
          <div class="qr-section">
            <p class="qr-label">Votre QR Code d'accès</p>
            <img [src]="result()!.qrCodeUrl" class="qr-img" alt="QR Code" />
            <p class="qr-hint">Présentez ce QR code à l'entrée de l'événement.</p>
          </div>
        }

        @if (result()!.pdfUrl) {
          <a [href]="result()!.pdfUrl" target="_blank" class="btn-pdf">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Télécharger la carte d'invitation
          </a>
        }

        <p class="notif-sent-note">
          Votre invitation vous a été envoyée selon votre mode de notification choisi.
        </p>
      </div>
      <div class="join-bottom-band">
        <p class="join-footer-text">Smart Invite — Gestion d'invitations</p>
      </div>
    </div>
  }

</div>
  `,
  styles: [`
*, *::before, *::after { box-sizing: border-box; }

.join-page {
  display: flex; justify-content: center; align-items: flex-start;
  width: 100%; padding: 1rem 0;
}

.state-card {
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px;
  padding: 3rem 2rem; max-width: 420px; width: 100%; text-align: center;
}
.state-text  { color: #666; font-size: 0.9rem; margin: 0; }
.state-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }
.state-sub   { font-size: 0.85rem; color: #666; margin: 0; }
.state-icon  { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.icon-error  { background: rgba(248,113,113,0.1); color: #f87171; }

.spinner {
  width: 36px; height: 36px;
  border: 3px solid #2a2a2a; border-top-color: #c9a84c;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.spinner-sm {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Card */
.join-card {
  background: #fff; color: #333;
  width: 100%; max-width: 560px;
  border-radius: 8px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
}

.join-top-band {
  background: #fff; border-bottom: 2px solid #c9a84c;
  padding: 1.5rem 2rem 1rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
}
.join-logo  { height: 52px; object-fit: contain; }
.join-title { font-size: 1.1rem; font-weight: 700; color: #c9a84c; text-align: center; margin: 0; }
.join-sub   { font-size: 0.8rem; color: #888; text-align: center; margin: 0; }

.join-body { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1rem; }
.join-body.center { align-items: center; text-align: center; }

/* Form */
.fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; }
.label { font-size: 0.78rem; font-weight: 600; color: #555; }
.req   { color: #f87171; }

.input {
  background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 8px;
  color: #333; font-size: 0.875rem; padding: 0.55rem 0.75rem;
  outline: none; transition: border-color 0.2s; width: 100%;
  &:focus { border-color: #c9a84c; background: #fff; }
  &.error { border-color: #f87171; }
}
.field-error { font-size: 0.72rem; color: #f87171; margin: 0; }

/* Notification options */
.notif-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.notif-opt {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 0.9rem; border-radius: 8px;
  border: 1px solid #e0e0e0; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  font-size: 0.82rem; color: #555;
  &:hover { border-color: #c9a84c; }
  &.selected { border-color: #c9a84c; background: rgba(201,168,76,0.08); color: #b8943e; font-weight: 600; }
}
.radio-hidden { display: none; }
.notif-icon  { font-size: 1rem; }
.notif-label { white-space: nowrap; }

.error-banner {
  background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3);
  border-radius: 8px; padding: 0.65rem 0.875rem;
  font-size: 0.82rem; color: #f87171;
}

.btn-submit {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  width: 100%; background: #c9a84c; color: #111;
  font-size: 0.9rem; font-weight: 700; padding: 0.75rem;
  border-radius: 8px; border: none; cursor: pointer;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #b8943e; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

/* Success */
.result-icon   { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.icon-success  { background: rgba(74,222,128,0.15); color: #4ade80; }
.result-title  { font-size: 1.2rem; font-weight: 700; color: #111; margin: 0; }
.result-sub    { font-size: 0.88rem; color: #555; line-height: 1.6; margin: 0; max-width: 340px; }

.qr-section { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
.qr-label   { font-size: 0.78rem; font-weight: 700; color: #c9a84c; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; }
.qr-img     { width: 140px; height: 140px; object-fit: contain; border: 2px solid #c9a84c; border-radius: 8px; padding: 4px; }
.qr-hint    { font-size: 0.72rem; color: #888; text-align: center; margin: 0; font-style: italic; max-width: 280px; }

.btn-pdf {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: #c9a84c; color: #111; font-size: 0.82rem; font-weight: 700;
  padding: 0.55rem 1.25rem; border-radius: 8px; text-decoration: none;
  transition: background 0.2s;
  &:hover { background: #b8943e; }
}

.notif-sent-note {
  font-size: 0.75rem; color: #aaa; text-align: center;
  margin: 0; font-style: italic; max-width: 320px;
}

.join-bottom-band {
  background: #fff; border-top: 2px solid #c9a84c;
  padding: 0.875rem 2rem; text-align: center;
}
.join-footer-text { font-size: 0.72rem; color: #bbb; margin: 0; font-style: italic; }

@media (max-width: 600px) {
  .join-body { padding: 1.25rem; }
  .fields-row { grid-template-columns: 1fr; }
  .notif-options { flex-direction: column; }
}
  `],
})
export class JoinComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb    = inject(FormBuilder);
  private readonly svc   = inject(LinkService);

  state      = signal<PageState>('form');
  submitting = signal(false);
  result     = signal<Invitation | null>(null);
  errorMsg   = signal('Ce lien est invalide ou a expiré.');
  submitError = signal<string | null>(null);

  readonly notifOptions: { key: NotificationMode; label: string; icon: string }[] = [
    { key: 'EMAIL',    label: 'Email',             icon: '📧' },
    { key: 'WHATSAPP', label: 'WhatsApp',           icon: '💬' },
    { key: 'BOTH',     label: 'Email & WhatsApp',   icon: '🔔' },
  ];

  form = this.fb.group({
    fullName:         ['', [Validators.required, Validators.minLength(2)]],
    email:            [''],
    phoneNumber:      [''],
    notificationMode: ['EMAIL' as NotificationMode],
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) { this.state.set('error'); }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const token = this.route.snapshot.paramMap.get('token')!;
    this.submitting.set(true);
    this.submitError.set(null);
    const v = this.form.value;
    this.svc.join(token, {
      fullName:         v.fullName!,
      email:            v.email        || undefined,
      phoneNumber:      v.phoneNumber  || undefined,
      notificationMode: v.notificationMode as NotificationMode,
    }).subscribe({
      next: (res) => {
        this.result.set(res.data!);
        this.state.set('success');
        this.submitting.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message;
        if (msg?.toLowerCase().includes('expiré') || msg?.toLowerCase().includes('invalide') || msg?.toLowerCase().includes('introuvable')) {
          this.errorMsg.set(msg);
          this.state.set('error');
        } else {
          this.submitError.set(msg || 'Une erreur est survenue. Veuillez réessayer.');
        }
        this.submitting.set(false);
      },
    });
  }
}
