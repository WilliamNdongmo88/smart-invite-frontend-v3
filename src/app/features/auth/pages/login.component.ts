import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="split-screen">

      <!-- LEFT PANEL -->
      <div class="left-panel">
        <div class="left-tag">SMART INVITE</div>

        <svg class="waves-svg" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice"
             xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stop-color="#c9a84c" stop-opacity="0.9"/>
              <stop offset="50%"  stop-color="#8B6914" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="#3d2e00" stop-opacity="0.5"/>
            </linearGradient>
            <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stop-color="#f0c040" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#c9a84c" stop-opacity="0.2"/>
            </linearGradient>
            <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%"   stop-color="#1a1a1a" stop-opacity="1"/>
              <stop offset="100%" stop-color="#2a2000" stop-opacity="1"/>
            </linearGradient>
          </defs>

          <!-- Background -->
          <rect width="600" height="700" fill="url(#g3)"/>

          <!-- Wave curves -->
          <path class="wave w1" d="M-50,200 C100,100 200,350 400,250 S600,100 700,200" fill="none" stroke="url(#g1)" stroke-width="80" stroke-linecap="round" opacity="0.5"/>
          <path class="wave w2" d="M-50,350 C150,200 300,500 500,350 S650,200 750,300" fill="none" stroke="url(#g2)" stroke-width="60" stroke-linecap="round" opacity="0.4"/>
          <path class="wave w3" d="M-50,500 C100,350 250,600 450,480 S620,320 700,420" fill="none" stroke="url(#g1)" stroke-width="90" stroke-linecap="round" opacity="0.3"/>
          <path class="wave w4" d="M-50,150 C200,50  350,400 550,280 S700,150 800,250" fill="none" stroke="url(#g2)" stroke-width="40" stroke-linecap="round" opacity="0.6"/>
          <path class="wave w5" d="M-50,600 C150,450 300,700 500,580 S680,400 750,500" fill="none" stroke="url(#g1)" stroke-width="50" stroke-linecap="round" opacity="0.35"/>
        </svg>

        <div class="left-bottom">
          <h2 class="left-headline">
            Créez des<br/>invitations<br/>mémorables
          </h2>
          <p class="left-sub">
            Gérez vos événements, envoyez vos invitations<br/>
            et suivez vos invités en temps réel.
          </p>
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div class="right-panel">
        <div class="right-inner">

          <div class="right-logo">
            <span class="logo-icon">✦</span>
            <span class="logo-text">Smart<span class="gold">Invite</span></span>
          </div>

          <h1 class="right-title">Bon retour</h1>
          <p class="right-sub">Entrez vos identifiants pour accéder à votre espace</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <div class="field">
              <label for="email">E-mail</label>
              <input id="email" type="email" formControlName="email"
                     placeholder="vous@exemple.com"
                     [class.invalid]="isInvalid('email')"
                     autocomplete="email"/>
              @if (isInvalid('email')) {
                <span class="field-error">E-mail invalide</span>
              }
            </div>

            <div class="field">
              <label for="password">Mot de passe</label>
              <div class="input-wrap">
                <input id="password" [type]="showPw() ? 'text' : 'password'"
                       formControlName="password" placeholder="••••••••"
                       [class.invalid]="isInvalid('password')"
                       autocomplete="current-password"/>
                <button type="button" class="eye-btn" (click)="showPw.set(!showPw())">
                  @if (showPw()) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              @if (isInvalid('password')) {
                <span class="field-error">Mot de passe requis</span>
              }
            </div>

            <div class="row-between">
              <span></span>
              <a routerLink="/forgot-password" class="forgot">Mot de passe oublié ?</a>
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span>
              }
              Se connecter
            </button>

          </form>

          <p class="bottom-link">
            Pas encore de compte ?
            <a routerLink="/register">Créer un compte</a>
          </p>

        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .split-screen {
      display: flex;
      height: 100vh;
      background: #0d0d0d;
    }

    /* ── LEFT ── */
    .left-panel {
      position: relative;
      width: 480px;
      flex-shrink: 0;
      overflow: hidden;
      border-radius: 16px;
      margin: 12px 6px 12px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .waves-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .wave {
      transform-origin: center;
    }
    .w1 { animation: drift1 8s ease-in-out infinite alternate; }
    .w2 { animation: drift2 10s ease-in-out infinite alternate; }
    .w3 { animation: drift3 12s ease-in-out infinite alternate; }
    .w4 { animation: drift1 9s ease-in-out infinite alternate-reverse; }
    .w5 { animation: drift2 11s ease-in-out infinite alternate-reverse; }

    @keyframes drift1 {
      from { transform: translateY(0px) scaleX(1); }
      to   { transform: translateY(-30px) scaleX(1.05); }
    }
    @keyframes drift2 {
      from { transform: translateY(0px) scaleX(1); }
      to   { transform: translateY(25px) scaleX(0.97); }
    }
    @keyframes drift3 {
      from { transform: translateY(0px); }
      to   { transform: translateY(-20px); }
    }

    .left-tag {
      position: relative;
      z-index: 2;
      padding: 1.5rem 1.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #c9a84c;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .left-tag::after {
      content: '';
      display: block;
      height: 1px;
      width: 40px;
      background: #c9a84c;
      opacity: 0.6;
    }

    .left-bottom {
      position: relative;
      z-index: 2;
      padding: 2rem 1.75rem;
    }

    .left-headline {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
      margin: 0 0 1rem;
      font-family: Georgia, serif;
    }

    .left-sub {
      font-size: 0.85rem;
      color: #aaa;
      line-height: 1.6;
      margin: 0;
    }

    /* ── RIGHT ── */
    .right-panel {
      flex: 1;
      background: #1a1a1a;
      border-radius: 16px;
      margin: 12px 12px 12px 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-y: auto;
    }

    .right-inner {
      width: 100%;
      max-width: 360px;
      padding: 2rem 1rem;
    }

    .right-logo {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2.5rem;
    }
    .logo-icon { color: #c9a84c; }
    .gold { color: #c9a84c; }

    .right-title {
      font-size: 1.9rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 0.4rem;
      font-family: Georgia, serif;
    }

    .right-sub {
      font-size: 0.85rem;
      color: #888;
      margin: 0 0 2rem;
    }

    .field {
      margin-bottom: 1.1rem;
    }

    label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #ccc;
      margin-bottom: 0.35rem;
    }

    input {
      width: 100%;
      background: #111;
      border: 1.5px solid #333;
      border-radius: 8px;
      padding: 0.7rem 0.875rem;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    input::placeholder { color: #555; }
    input:focus { border-color: #c9a84c; }
    input.invalid { border-color: #e05252; }

    .input-wrap { position: relative; }
    .input-wrap input { padding-right: 2.75rem; }

    .eye-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      display: flex;
      align-items: center;
      padding: 0;
    }
    .eye-btn:hover { color: #ccc; }

    .field-error {
      display: block;
      font-size: 0.75rem;
      color: #e05252;
      margin-top: 0.3rem;
    }

    .row-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .forgot {
      font-size: 0.8rem;
      color: #c9a84c;
      text-decoration: none;
      font-weight: 600;
    }
    .forgot:hover { text-decoration: underline; }

    .btn-submit {
      width: 100%;
      background: #c9a84c;
      color: #111;
      border: none;
      border-radius: 8px;
      padding: 0.8rem;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 0.2s, opacity 0.2s;
      letter-spacing: 0.02em;
    }
    .btn-submit:hover:not(:disabled) { background: #b8943e; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid #11111144;
      border-top-color: #111;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .bottom-link {
      text-align: center;
      margin-top: 1.75rem;
      font-size: 0.85rem;
      color: #888;
    }
    .bottom-link a {
      color: #c9a84c;
      font-weight: 700;
      text-decoration: none;
    }
    .bottom-link a:hover { text-decoration: underline; }

    /* Responsive */
    @media (max-width: 768px) {
      .left-panel { display: none; }
      .right-panel { flex: 1; margin: 0; border-radius: 0; }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  loading = signal(false);
  showPw = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { email, password } = this.form.value;
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        const role = this.authService.getRole();
        if (role === 'ADMIN') this.router.navigate(['/admin/users']);
        else if (role === 'AGENT') this.router.navigate(['/checkin/scan']);
        else this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message ?? 'Identifiants incorrects');
      },
    });
  }
}
