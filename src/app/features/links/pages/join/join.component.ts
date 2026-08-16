import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LinkService } from '../../../../core/services/link.service';
import { Invitation } from '../../../../core/models/invitation.model';
import { NotificationMode } from '../../../../core/models/enums.model';

type PageState = 'loading' | 'form' | 'success' | 'error';

type InvitationViewData = Invitation & {
  eventTitle?: string;
  eventName?: string;
  coupleNames?: string;
  brideName?: string;
  groomName?: string;
  eventDate?: string;
  eventMessage?: string;
  venue?: string;
  eventLocation?: string;
  couplePhotoUrl?: string;
  photoUrl?: string;
};

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss'],
})
export class JoinComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(LinkService);

  state = signal<PageState>('form');
  submitting = signal(false);
  result = signal<Invitation | null>(null);
  errorMsg = signal('Ce lien est invalide ou a expiré.');
  submitError = signal<string | null>(null);

  readonly simulatedCouplePhoto ='/img/photoCouple.avif';

  readonly notifOptions: { key: NotificationMode; label: string; icon: string }[] = [
    { key: 'EMAIL', label: 'Email', icon: '✉' },
    { key: 'WHATSAPP', label: 'WhatsApp', icon: '◌' },
    { key: 'BOTH', label: 'Email & WhatsApp', icon: '✦' },
  ];

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: [''],
    phoneNumber: [''],
    notificationMode: ['EMAIL' as NotificationMode],
  });

  ngOnInit(): void {
    if (!this.route.snapshot.paramMap.get('token')) this.state.set('error');
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  private data(): InvitationViewData | null {
    return this.result() as InvitationViewData | null;
  }

  coupleNames(): string {
    const data = this.data();
    if (data?.coupleNames) return data.coupleNames;
    if (data?.brideName && data?.groomName) return `${data.groomName} & ${data.brideName}`;
    return 'Votre événement';
  }

  eventTitle(): string {
    const data = this.data();
    return data?.eventTitle || data?.eventName || 'Invitation à l’événement';
  }

  eventDate(): string {
    return this.data()?.eventDate || 'Date de l’événement';
  }

  eventMessage(): string {
    return this.data()?.eventMessage || 'Nous avons le plaisir de vous compter parmi nos invités.';
  }

  eventLocation(): string {
    const data = this.data();
    return data?.venue || data?.eventLocation || 'Lieu de l’événement';
  }

  couplePhoto(): string {
    const data = this.data();
    return data?.couplePhotoUrl || data?.photoUrl || this.simulatedCouplePhoto;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    const value = this.form.value;

    this.svc.join(token, {
      fullName: value.fullName!,
      email: value.email || undefined,
      phoneNumber: value.phoneNumber || undefined,
      notificationMode: value.notificationMode as NotificationMode,
    }).subscribe({
      next: (response) => {
        this.result.set(response.data!);
        this.state.set('success');
        this.submitting.set(false);
      },
      error: (error) => {
        const message = error?.error?.message;
        const normalized = message?.toLowerCase() || '';

        if (normalized.includes('expiré') || normalized.includes('invalide') || normalized.includes('introuvable')) {
          this.errorMsg.set(message);
          this.state.set('error');
        } else {
          this.submitError.set(message || 'Une erreur est survenue. Veuillez réessayer.');
        }
        this.submitting.set(false);
      },
    });
  }
}

export type { InvitationViewData };

/*
  Propriétés optionnelles utilisées si l’API les renvoie :
  eventTitle/eventName, coupleNames ou brideName + groomName, eventDate,
  eventMessage, venue/eventLocation et couplePhotoUrl/photoUrl.
*/
