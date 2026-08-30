import { Component, inject, signal, OnInit, AfterViewInit, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: 'login.component.html',
  styleUrl: 'login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('googleBtnRef') googleBtnRef!: ElementRef;

  loading = signal(false);
  showPw = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initGoogle();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.renderGoogleButton();
  }

  private initGoogle(): void {
    const g = (window as any)['google'];
    if (g) {
      g.accounts.id.initialize({
        client_id: '89754196271-qo6ib1886v6klb4ki1kb9c3sc4h9j8sq.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleCallback(response),
      });
    } else {
      // Le script est chargé async — on attend qu'il soit disponible
      window.addEventListener('load', () => {
        const gLoaded = (window as any)['google'];
        if (gLoaded) {
          gLoaded.accounts.id.initialize({
            client_id: '89754196271-qo6ib1886v6klb4ki1kb9c3sc4h9j8sq.apps.googleusercontent.com',
            callback: (response: any) => this.handleGoogleCallback(response),
          });
          this.renderGoogleButton();
        }
      }, { once: true });
    }
  }

  private renderGoogleButton(): void {
    const g = (window as any)['google'];
    if (!g || !this.googleBtnRef?.nativeElement) return;
    g.accounts.id.renderButton(this.googleBtnRef.nativeElement, {
      theme: 'filled_black',
      size: 'large',
      width: this.googleBtnRef.nativeElement.offsetWidth || 360,
      text: 'continue_with',
      locale: 'fr',
    });
  }

  private handleGoogleCallback(response: { credential: string }): void {
    this.loading.set(true);
    this.authService.googleLogin(response.credential).subscribe({
      next: (res) => {
        if (res.data?.needsRegistration) {
          this.router.navigate(['/register'], {
            queryParams: {
              email: res.data.email,
              name: res.data.name,
              avatar: res.data.avatarUrl,
              google: true,
            },
          });
        } else {
          const role = this.authService.getRole();
          if (role === 'ADMIN') this.router.navigate(['/admin/users']);
          else if (role === 'AGENT') this.router.navigate(['/checkin/scan']);
          else this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message ?? 'Erreur Google');
      },
    });
  }

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
