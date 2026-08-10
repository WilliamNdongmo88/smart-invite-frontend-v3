import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'verify-email.component.html',
  styleUrl: 'verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  email = signal('');
  digits = signal<string[]>(['', '', '', '', '', '']);
  loading = signal(false);
  resendLoading = signal(false);
  countdown = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const email = this.route.snapshot.queryParams['email'] ?? '';
    this.email.set(email);
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private startCountdown(): void {
    this.countdown.set(60);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown.update(v => {
        if (v <= 1) { clearInterval(this.timer!); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    const arr = [...this.digits()];
    arr[index] = val;
    this.digits.set(arr);
    if (val && index < 5) {
      this.otpInputs.toArray()[index + 1].nativeElement.focus();
    }
    if (arr.every(d => d !== '') && arr.join('').length === 6) {
      this.submit();
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      this.otpInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (!text) return;
    const arr = text.split('').concat(Array(6).fill('')).slice(0, 6);
    this.digits.set(arr);
    const lastFilled = Math.min(text.length, 5);
    setTimeout(() => this.otpInputs.toArray()[lastFilled].nativeElement.focus());
    if (text.length === 6) setTimeout(() => this.submit(), 100);
  }

  submit(): void {
    const otp = this.digits().join('');
    if (otp.length < 6) return;
    this.loading.set(true);
    this.auth.verifyEmail({ email: this.email(), otp }).subscribe({
      next: () => {
        this.toast.success('Compte activé ! Vous pouvez vous connecter.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.digits.set(['', '', '', '', '', '']);
        setTimeout(() => this.otpInputs.toArray()[0].nativeElement.focus());
        this.toast.error(err?.error?.message ?? 'Code invalide');
      },
    });
  }

  resend(): void {
    if (this.countdown() > 0 || this.resendLoading()) return;
    this.resendLoading.set(true);
    this.auth.resendOtp(this.email()).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.toast.success('Nouveau code envoyé !');
        this.startCountdown();
      },
      error: (err) => {
        this.resendLoading.set(false);
        this.toast.error(err?.error?.message ?? 'Erreur lors du renvoi');
      },
    });
  }

  get maskedEmail(): string {
    const e = this.email();
    const [local, domain] = e.split('@');
    if (!local || !domain) return e;
    return local.slice(0, 2) + '***@' + domain;
  }
}
