import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { NotificationMode } from '../../../../core/models/enums.model';
import { DIAL_CODES } from '../../../../core/data/dial-codes';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pw = ctrl.get('password')?.value;
  const confirm = ctrl.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: 'register.component.html',
  styleUrl: 'register.component.scss',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly lang = inject(LanguageService);

  loading = signal(false);
  showPw = signal(false);
  showConfirm = signal(false);
  fromGoogle = signal(false);
  hasReferral = signal(true);
  referralError = signal('');
  referralValid = signal(false);
  referralChecking = signal(false);

  readonly dialCodes = DIAL_CODES;

  form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneDialCode: ['+237'],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      referralCode: [''],
    },
    { validators: passwordMatchValidator }
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const params = this.route.snapshot.queryParams;
    if (params['email']) this.form.patchValue({ email: params['email'] });
    if (params['name']) this.form.patchValue({ name: params['name'] });
    if (params['google']) this.fromGoogle.set(true);
    else this.initReferralWatcher();
  }

  private initReferralWatcher(): void {
    this.form
      .get('referralCode')!
      .valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.referralValid.set(false);
          this.referralError.set('');
        }),
        switchMap((raw) => {
          const code = raw?.trim().toUpperCase() ?? '';
          if (this.hasReferral() && code.length >= 5) {
            this.referralChecking.set(true);
            return this.auth.validateReferralCode(code).pipe(
              tap(() => this.referralChecking.set(false))
            );
          }
          return [];
        })
      )
      .subscribe({
        next: (res) => {
          if (!this.hasReferral()) return;
          if (res.data?.valid) this.referralValid.set(true);
          else this.referralError.set(this.lang.t('auth.register.referralError'));
        },
        error: () => {
          this.referralChecking.set(false);
          this.referralError.set(this.lang.t('auth.register.referralError'));
        },
      });
  }

  onToggleReferral(checked: boolean): void {
    this.hasReferral.set(checked);
    this.referralValid.set(false);
    this.referralError.set('');
    this.referralChecking.set(false);
    if (checked) {
      const raw = this.form.get('referralCode')?.value ?? '';
      if ((raw ?? '').trim().length >= 5) this.form.get('referralCode')!.updateValueAndValidity();
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get passwordMismatch(): boolean {
    return !!(
      this.form.hasError('passwordMismatch') &&
      this.form.get('confirmPassword')?.touched
    );
  }

  onSubmit(): void {
    // Si le code de recommandation est activé mais vide → bloquer et afficher l'erreur
    if (this.hasReferral()) {
      const code = this.form.get('referralCode')?.value?.trim() ?? '';
      if (!code) {
        this.referralError.set(this.lang.t('auth.register.referralRequired'));
        this.form.get('referralCode')!.markAsTouched();
        return;
      }
      // Code saisi mais non validé
      if (!this.referralValid()) {
        this.form.markAllAsTouched();
        return;
      }
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { name, email, phoneDialCode, phone, password, referralCode } = this.form.value;

    // Compose le numéro complet : indicatif + numéro local (sans zéros en tête)
    const local = phone!.trim().replace(/^0+/, '');
    const fullPhone = `${phoneDialCode}${local}`;

    const payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      notificationMode: NotificationMode;
      referralCode?: string;
    } = {
      name: name!,
      email: email!,
      phone: fullPhone,
      password: password!,
      notificationMode: 'EMAIL' as NotificationMode,
    };
    if (this.hasReferral() && referralCode) {
      payload.referralCode = referralCode.trim().toUpperCase();
    }

    this.auth
      .register(payload)
      .subscribe({
        next: () => {
          this.router.navigate(['/verify-email'], {
            queryParams: { email: email! },
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err?.error?.message ?? this.lang.t('auth.register.errorDefault'));
        },
      });
  }
}
