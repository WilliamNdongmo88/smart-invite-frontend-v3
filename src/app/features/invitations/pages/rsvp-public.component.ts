import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InvitationService } from '../../../core/services/invitation.service';
import { PublicInvitation } from '../../../core/models/invitation.model';
import { EVENT_TYPE_LABELS } from '../../../core/models/enums.model';

type PageState = 'loading' | 'ready' | 'confirmed' | 'declined' | 'already' | 'error';

@Component({
  selector: 'app-rsvp-public',
  standalone: true,
  imports: [],
  template: `
<div class="rsvp-page">

  <!-- Loading -->
  @if (state() === 'loading') {
    <div class="state-card">
      <div class="spinner"></div>
      <p class="state-text">Chargement de votre invitation…</p>
    </div>
  }

  <!-- Error -->
  @if (state() === 'error') {
    <div class="state-card">
      <div class="state-icon icon-error">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 class="state-title">Invitation introuvable</h2>
      <p class="state-sub">Ce lien est invalide ou a expiré.</p>
    </div>
  }

  <!-- Invitation ready -->
  @if (state() === 'ready' && inv()) {
    <div class="inv-card">
      <div class="inv-top-band">
        <img src="/img/logo.png" class="inv-logo" alt="Smart Invite" />
        <p class="inv-title">Vous êtes cordialement invité(e)</p>
        <p class="inv-event-type">{{ typeLabel() }}</p>
      </div>

      <div class="inv-body">
        <p class="inv-greeting">Cher/Chère <strong>{{ inv()!.guestName }}</strong>,</p>
        <p class="inv-message">
          Nous avons l'immense honneur de vous convier à
          <strong>{{ inv()!.eventTitle }}</strong>.
        </p>

        @if (inv()!.eventDate) {
          <div class="inv-date-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{{ formatDate(inv()!.eventDate!) }}</span>
          </div>
        }

        <hr class="inv-divider" />

        <p class="inv-question">Confirmez-vous votre présence ?</p>

        <div class="inv-actions">
          <button class="btn-confirm" [disabled]="submitting()" (click)="respond('CONFIRMED')">
            @if (submitting() === 'CONFIRMED') { <span class="spinner-sm"></span> }
            @else { ✅ }
            Je confirme
          </button>
          <button class="btn-decline" [disabled]="submitting()" (click)="respond('DECLINED')">
            @if (submitting() === 'DECLINED') { <span class="spinner-sm"></span> }
            @else { ❌ }
            Je décline
          </button>
        </div>
      </div>

      <div class="inv-bottom-band">
        <p class="inv-footer-text">Smart Invite — Gestion d'invitations</p>
      </div>
    </div>
  }

  <!-- Confirmed -->
  @if (state() === 'confirmed' && inv()) {
    <div class="inv-card">
      <div class="inv-top-band">
        <img src="/img/logo.png" class="inv-logo" alt="Smart Invite" />
      </div>
      <div class="inv-body center">
        <div class="result-icon icon-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="result-title">Présence confirmée !</h2>
        <p class="result-sub">
          Merci <strong>{{ inv()!.guestName }}</strong>, votre présence à
          <strong>{{ inv()!.eventTitle }}</strong> a bien été enregistrée.
        </p>
        @if (inv()!.qrCodeUrl) {
          <div class="qr-section">
            <p class="qr-label">Votre QR Code d'accès</p>
            <img [src]="inv()!.qrCodeUrl" class="qr-img" alt="QR Code" />
            <p class="qr-hint">Présentez ce QR code à l'entrée de l'événement.</p>
          </div>
        }
        @if (inv()!.pdfUrl) {
          <a [href]="inv()!.pdfUrl" target="_blank" class="btn-pdf">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Télécharger la carte d'invitation
          </a>
        }
      </div>
      <div class="inv-bottom-band">
        <p class="inv-footer-text">Smart Invite — Gestion d'invitations</p>
      </div>
    </div>
  }

  <!-- Declined -->
  @if (state() === 'declined' && inv()) {
    <div class="inv-card">
      <div class="inv-top-band">
        <img src="/img/logo.png" class="inv-logo" alt="Smart Invite" />
      </div>
      <div class="inv-body center">
        <div class="result-icon icon-declined">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <h2 class="result-title">Absence enregistrée</h2>
        <p class="result-sub">
          Merci <strong>{{ inv()!.guestName }}</strong> de nous avoir informés.
          Nous espérons vous retrouver lors d'un prochain événement.
        </p>
      </div>
      <div class="inv-bottom-band">
        <p class="inv-footer-text">Smart Invite — Gestion d'invitations</p>
      </div>
    </div>
  }

  <!-- Already responded -->
  @if (state() === 'already') {
    <div class="state-card">
      <div class="state-icon icon-info">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 class="state-title">Réponse déjà enregistrée</h2>
      <p class="state-sub">Vous avez déjà répondu à cette invitation.</p>
    </div>
  }

</div>
  `,
  styles: [`
*, *::before, *::after { box-sizing: border-box; }

.rsvp-page {
  display: flex; justify-content: center; align-items: flex-start;
  width: 100%; padding: 1rem 0;
}

/* State cards (loading/error/already) */
.state-card {
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px;
  padding: 3rem 2rem; max-width: 420px; width: 100%; text-align: center;
}
.state-text  { color: #666; font-size: 0.9rem; margin: 0; }
.state-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }
.state-sub   { font-size: 0.85rem; color: #666; margin: 0; }

.state-icon {
  width: 56px; height: 56px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.icon-error   { background: rgba(248,113,113,0.1); color: #f87171; }
.icon-info    { background: rgba(96,165,250,0.1);  color: #60a5fa; }

/* Spinner */
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

/* Invitation card */
.inv-card {
  background: #fff; color: #333;
  width: 100%; max-width: 560px;
  border-radius: 8px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.4);
  font-family: Georgia, 'Times New Roman', serif;
  overflow: hidden;
}

.inv-top-band {
  background: #fff; border-bottom: 2px solid #c9a84c;
  padding: 1.5rem 2rem 1rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
}
.inv-logo       { height: 56px; object-fit: contain; }
.inv-title      { font-size: 1rem; font-weight: 700; color: #c9a84c; text-align: center; margin: 0; font-style: italic; }
.inv-event-type { font-size: 0.75rem; color: #999; text-align: center; margin: 0; text-transform: uppercase; letter-spacing: 0.1em; }

.inv-body { padding: 1.75rem 2.5rem; display: flex; flex-direction: column; gap: 1rem; }
.inv-body.center { align-items: center; text-align: center; }

.inv-greeting { font-size: 0.9rem; color: #333; margin: 0; }
.inv-message  { font-size: 0.88rem; color: #444; line-height: 1.6; margin: 0; }

.inv-date-row {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; color: #c9a84c; font-weight: 600;
  svg { flex-shrink: 0; }
}

.inv-divider { border: none; border-top: 1px solid #c9a84c; margin: 0; }

.inv-question { font-size: 0.9rem; font-weight: 700; color: #333; text-align: center; margin: 0; }

.inv-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }

.btn-confirm, .btn-decline {
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: 0.875rem; font-weight: 700; padding: 0.65rem 1.5rem;
  border-radius: 8px; border: none; cursor: pointer;
  transition: opacity 0.2s; font-family: inherit;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.btn-confirm { background: #c9a84c; color: #111; &:hover:not(:disabled) { background: #b8943e; } }
.btn-decline { background: #f1f1f1; color: #555; border: 1px solid #ddd; &:hover:not(:disabled) { background: #e5e5e5; } }

.inv-bottom-band {
  background: #fff; border-top: 2px solid #c9a84c;
  padding: 0.875rem 2rem; text-align: center;
}
.inv-footer-text { font-size: 0.72rem; color: #bbb; margin: 0; font-style: italic; }

/* Result states */
.result-icon {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.icon-success  { background: rgba(74,222,128,0.15); color: #4ade80; }
.icon-declined { background: rgba(248,113,113,0.15); color: #f87171; }

.result-title { font-size: 1.2rem; font-weight: 700; color: #111; margin: 0; }
.result-sub   { font-size: 0.88rem; color: #555; line-height: 1.6; margin: 0; max-width: 340px; }

.qr-section { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
.qr-label   { font-size: 0.78rem; font-weight: 700; color: #c9a84c; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; }
.qr-img     { width: 140px; height: 140px; object-fit: contain; border: 2px solid #c9a84c; border-radius: 8px; padding: 4px; }
.qr-hint    { font-size: 0.72rem; color: #888; text-align: center; margin: 0; font-style: italic; max-width: 280px; }

.btn-pdf {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: #c9a84c; color: #111; font-size: 0.82rem; font-weight: 700;
  padding: 0.55rem 1.25rem; border-radius: 8px; text-decoration: none;
  transition: background 0.2s; font-family: sans-serif;
  &:hover { background: #b8943e; }
}

@media (max-width: 600px) {
  .inv-body { padding: 1.25rem 1.25rem; }
  .inv-top-band { padding: 1.25rem 1.25rem 0.75rem; }
}
  `],
})
export class RsvpPublicComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc   = inject(InvitationService);

  state      = signal<PageState>('loading');
  inv        = signal<PublicInvitation | null>(null);
  submitting = signal<'CONFIRMED' | 'DECLINED' | null>(null);

  typeLabel = computed(() => {
    const t = this.inv()?.eventType;
    return t ? EVENT_TYPE_LABELS[t] : '';
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) { this.state.set('error'); return; }

    this.svc.getPublic(token).subscribe({
      next: (res) => {
        this.inv.set(res.data!);
        const status = res.data!.rsvpStatus;
        if (status === 'CONFIRMED') { this.state.set('confirmed'); }
        else if (status === 'DECLINED') { this.state.set('declined'); }
        else { this.state.set('ready'); }
      },
      error: () => this.state.set('error'),
    });
  }

  respond(status: 'CONFIRMED' | 'DECLINED'): void {
    const token = this.route.snapshot.paramMap.get('token')!;
    this.submitting.set(status);
    this.svc.rsvp(token, { status }).subscribe({
      next: (res) => {
        this.inv.set(res.data!);
        this.state.set(status === 'CONFIRMED' ? 'confirmed' : 'declined');
        this.submitting.set(null);
      },
      error: () => {
        this.state.set('error');
        this.submitting.set(null);
      },
    });
  }

  formatDate(dt: string): string {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const days   = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const h = d.getHours().toString().padStart(2,'0');
    const m = d.getMinutes().toString().padStart(2,'0');
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}:${m}`;
  }
}
