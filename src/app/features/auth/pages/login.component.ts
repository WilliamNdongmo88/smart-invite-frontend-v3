import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-icon">✦</span>
          <span class="logo-text">Smart<span class="gold">Invite</span></span>
        </div>

        <h1 class="auth-title">Connexion</h1>
        <p class="auth-subtitle">Accédez à votre espace organisateur</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="field">
            <label for="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="vous@exemple.com"
              [class.invalid]="isInvalid('email')"
              autocomplete="email"
            />
            @if (isInvalid('email')) {
              <span class="field-error">E-mail invalide</span>
            }
          </div>

          <div class="field">
            <label for="password">Mot de passe</label>
            <div class="input-group">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                [class.invalid]="isInvalid('password')"
                autocomplete="current-password"
              />
              <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? '🙈' : '👁️' }}
              </button>
            </div>
            @if (isInvalid('password')) {
              <span class="field-error">Mot de passe requis</span>
            }
          </div>

          <div class="forgot-link">
            <a routerLink="/forgot-password">Mot de passe oublié ?</a>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span> Connexion…
            } @else {
              Se connecter
            }
          </button>
        </form>

        <p class="auth-footer">
          Pas encore de compte ?
          <a routerLink="/register">Créer un compte</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      background: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .auth-card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 420px;
    }

    .auth-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
      margin-bottom: 2rem;
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
    }

    .logo-icon { color: #c9a84c; font-size: 1.2rem; }
    .gold { color: #c9a84c; }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 0.25rem;
      text-align: center;
    }

    .auth-subtitle {
      color: #888;
      font-size: 0.875rem;
      text-align: center;
      margin: 0 0 2rem;
    }

    .field {
      margin-bottom: 1.25rem;
    }

    label {
      display: block;
      font-size: 0.875rem;
      color: #ccc;
      margin-bottom: 0.4rem;
    }

    input {
      width: 100%;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 0.65rem 0.875rem;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    input:focus { border-color: #c9a84c; }
    input.invalid { border-color: #e05252; }

    .input-group {
      position: relative;
    }

    .input-group input {
      padding-right: 2.75rem;
    }

    .toggle-pw {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
    }

    .field-error {
      display: block;
      font-size: 0.78rem;
      color: #e05252;
      margin-top: 0.3rem;
    }

    .forgot-link {
      text-align: right;
      margin-bottom: 1.5rem;
    }

    .forgot-link a {
      font-size: 0.8rem;
      color: #c9a84c;
      text-decoration: none;
    }

    .forgot-link a:hover { text-decoration: underline; }

    .btn-primary {
      width: 100%;
      background: #c9a84c;
      color: #111;
      border: none;
      border-radius: 8px;
      padding: 0.75rem;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 0.2s, opacity 0.2s;
    }

    .btn-primary:hover:not(:disabled) { background: #b8943e; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #11111155;
      border-top-color: #111;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #888;
    }

    .auth-footer a {
      color: #c9a84c;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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
        const msg = err?.error?.message ?? 'Identifiants incorrects';
        this.toast.error(msg);
      },
    });
  }
}
