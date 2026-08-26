import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LinkService } from '../../../../core/services/link.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EventService } from '../../../../core/services/event.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Invitation } from '../../../../core/models/invitation.model';
import { NotificationMode } from '../../../../core/models/enums.model';

type PageState = 'loading' | 'form' | 'success' | 'error';

type LinkPreview = {
  eventTitle: string;
  concernedNames: string;
  eventDate: string;
  couplePhotoUrl: string | null;
  banquetLocation: string | null;
};

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
  private readonly authSvc = inject(AuthService);
  private readonly eventSvc = inject(EventService);
  private readonly toast = inject(ToastService);

  state = signal<PageState>('loading');
  submitting = signal(false);
  uploading = signal(false);
  result = signal<Invitation | null>(null);
  previewData = signal<LinkPreview | null>(null);
  customPhotoUrl = signal<string | null>(null);
  errorMsg = signal('Ce lien est invalide ou a expiré.');
  submitError = signal<string | null>(null);

  isLoggedIn = computed(() => this.authSvc.isLoggedIn());

  readonly simulatedCouplePhoto = '/img/photoCouple.avif';

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
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }

    // Mode prévisualisation locale (depuis sessionStorage)
    if (token === 'preview') {
      const raw = sessionStorage.getItem('join_preview');
      if (raw) {
        this.previewData.set(JSON.parse(raw));
        this.state.set('form');
      } else {
        this.state.set('error');
      }
      return;
    }

    this.svc.preview(token).subscribe({
      next: (res) => {
        this.previewData.set(res.data!);
        this.state.set('form');
      },
      error: () => this.state.set('error'),
    });
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  private data(): InvitationViewData | null {
    return this.result() as InvitationViewData | null;
  }

  coupleNames(): string {
    const p = this.previewData();
    if (p?.concernedNames) return p.concernedNames;
    const data = this.data();
    if (data?.coupleNames) return data.coupleNames;
    if (data?.brideName && data?.groomName) return `${data.groomName} & ${data.brideName}`;
    return 'Votre événement';
  }

  eventTitle(): string {
    const p = this.previewData();
    if (p?.eventTitle) return p.eventTitle;
    const data = this.data();
    return data?.eventTitle || data?.eventName || "Invitation à l'événement";
  }

  eventDate(): string {
    const p = this.previewData();
    if (p?.eventDate) return p.eventDate;
    return this.data()?.eventDate || "Date de l'événement";
  }

  eventMessage(): string {
    return this.data()?.eventMessage || 'Nous avons le plaisir de vous compter parmi nos invités.';
  }

  eventLocation(): string {
    const p = this.previewData();
    if (p?.banquetLocation) return p.banquetLocation;
    const data = this.data();
    return data?.venue || data?.eventLocation || "Lieu de l'événement";
  }

  couplePhoto(): string {
    if (this.customPhotoUrl()) return this.customPhotoUrl()!;
    const p = this.previewData();
    if (p?.couplePhotoUrl) return p.couplePhotoUrl;
    const data = this.data();
    return data?.couplePhotoUrl || data?.photoUrl || this.simulatedCouplePhoto;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.uploading.set(true);
    this.eventSvc.uploadImage(file, 'photos').subscribe({
      next: (res) => {
        const url = res.data;
        if (url) {
          this.customPhotoUrl.set(url);
          const raw = sessionStorage.getItem('join_preview');
          if (raw) {
            try {
              const preview = JSON.parse(raw);
              preview.couplePhotoUrl = url;
              sessionStorage.setItem('join_preview', JSON.stringify(preview));
            } catch (e) {}
          }
          this.toast.success('Photo mise à jour et enregistrée sur Firebase !');
        }
        this.uploading.set(false);
      },
      error: () => {
        this.toast.error("Erreur lors de l'upload de l'image sur Firebase.");
        this.uploading.set(false);
      }
    });
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
