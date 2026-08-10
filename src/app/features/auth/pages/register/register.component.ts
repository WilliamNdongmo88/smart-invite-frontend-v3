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
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { NotificationMode } from '../../../../core/models/enums.model';

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pw = ctrl.get('password')?.value;
  const confirm = ctrl.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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

  loading = signal(false);
  showPw = signal(false);
  showConfirm = signal(false);
  fromGoogle = signal(false);

  form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const params = this.route.snapshot.queryParams;
    if (params['email']) this.form.patchValue({ email: params['email'] });
    if (params['name']) this.form.patchValue({ name: params['name'] });
    if (params['google']) this.fromGoogle.set(true);
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { name, email, phone, password } = this.form.value;
    this.auth
      .register({
        name: name!,
        email: email!,
        phone: phone || undefined,
        password: password!,
        notificationMode: 'EMAIL' as NotificationMode,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/verify-email'], {
            queryParams: { email: email! },
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err?.error?.message ?? 'Erreur lors de l\'inscription');
        },
      });
  }
}
