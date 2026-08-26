import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InvitationService } from '../../../core/services/invitation.service';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { PublicInvitation } from '../../../core/models/invitation.model';
import { EVENT_TYPE_LABELS } from '../../../core/models/enums.model';

type PageState = 'loading' | 'ready' | 'confirmed' | 'declined' | 'error';

@Component({
  selector: 'app-rsvp-public',
  standalone: true,
  imports: [],
  templateUrl: './rsvp-public.component.html',
  styleUrls: ['./rsvp-public.component.scss'],
})
export class RsvpPublicComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(InvitationService);
  private readonly authSvc = inject(AuthService);
  private readonly eventSvc = inject(EventService);
  private readonly toast = inject(ToastService);

  state = signal<PageState>('loading');
  inv = signal<PublicInvitation | null>(null);
  submitting = signal<'CONFIRMED' | 'DECLINED' | null>(null);
  uploading = signal(false);
  customPhotoUrl = signal<string | null>(null);
  errorMsg = signal('Ce lien est invalide ou a expiré.');

  isLoggedIn = computed(() => this.authSvc.isLoggedIn());

  readonly simulatedCouplePhoto = '/img/photoCouple.avif';

  eventType = computed<import('../../../core/models/enums.model').EventType>(() => {
    return this.inv()?.eventType || 'MARIAGE';
  });

  themeClass = computed(() => 'theme-' + this.eventType().toLowerCase());

  eyebrowText = computed(() => {
    const t = this.eventType();
    if (t === 'CONFERENCE') return 'SOMMET & CONFÉRENCE OFFICIELLE';
    if (t === 'GALA') return 'SOIRÉE DE GALA & PRESTIGE';
    if (t === 'CEREMONIE') return 'CÉRÉMONIE OFFICIELLE';
    return this.eventTitle();
  });

  mainTitleText = computed(() => {
    const t = this.eventType();
    if (t === 'CONFERENCE') return 'Accréditation';
    if (t === 'GALA') return 'Invitation VIP';
    if (t === 'CEREMONIE') return 'Célébration';
    return 'Invitation';
  });

  introText = computed(() => {
    const t = this.eventType();
    if (t === 'CONFERENCE') return 'Vous êtes convié(e) à participer à cette session de haut niveau';
    if (t === 'GALA') return 'Le comité d’honneur est honoré de vous compter parmi ses invités de marque';
    if (t === 'CEREMONIE') return 'Vous êtes chaleureusement convié(e) à célébrer ce moment marquant';
    return 'Vous êtes cordialement invité(e) à célébrer ce moment';
  });

  salutationLead = computed(() => {
    const t = this.eventType();
    if (t === 'CONFERENCE') return 'Votre accréditation nominative a été préparée avec soin pour cette conférence.';
    if (t === 'GALA') return 'Une table d’honneur vous est réservée pour cette prestigieuse réception.';
    if (t === 'CEREMONIE') return 'Votre présence rendra cette cérémonie encore plus mémorable.';
    return "Nous avons le plaisir et l'honneur de vous compter parmi nos invités d'exception.";
  });

  ornamentGlyph = computed(() => {
    const t = this.eventType();
    if (t === 'CONFERENCE') return '⟨ // ⟩';
    if (t === 'GALA') return '✦ ❖ ✦';
    if (t === 'CEREMONIE') return '⚜';
    return '✦';
  });

  confirmBtnText = computed(() => {
    const t = this.eventType();
    if (t === 'CONFERENCE') return 'Je valide mon accréditation';
    if (t === 'GALA') return 'Je confirme ma venue au Gala';
    if (t === 'CEREMONIE') return 'Je confirme ma participation';
    return 'Je confirme ma présence';
  });

  defaultPhotoForType = computed(() => {
    const t = this.eventType();
    if (t === 'CONFERENCE') return '/images/background-section-hero.webp';
    if (t === 'GALA') return '/images/couple_en_fete.webp';
    if (t === 'CEREMONIE') return '/images/mr-mme-zome.webp';
    return this.simulatedCouplePhoto;
  });

  typeLabel = computed(() => {
    const t = this.inv()?.eventType;
    return t ? EVENT_TYPE_LABELS[t] : '';
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }

    this.svc.getPublic(token).subscribe({
      next: (res) => {
        this.inv.set(res.data!);
        const status = res.data!.rsvpStatus;
        if (status === 'CONFIRMED') {
          this.state.set('confirmed');
        } else if (status === 'DECLINED') {
          this.state.set('declined');
        } else {
          this.state.set('ready');
        }
      },
      error: (err) => {
        const msg = err?.error?.message;
        if (msg) this.errorMsg.set(msg);
        this.state.set('error');
      },
    });
  }

  coupleNames(): string {
    const i = this.inv();
    if (i?.concernedNames) return i.concernedNames;
    return i?.eventTitle || 'Votre événement';
  }

  eventTitle(): string {
    return this.inv()?.eventTitle || 'Invitation';
  }

  eventDate(): string {
    const dt = this.inv()?.eventDate || this.inv()?.banquetDateTime;
    if (!dt) return "Date de l'événement";
    return this.formatDate(dt);
  }

  eventLocation(): string {
    const i = this.inv();
    return i?.banquetLocation || i?.religiousLocation || i?.civilLocation || '';
  }

  couplePhoto(): string {
    if (this.customPhotoUrl()) return this.customPhotoUrl()!;
    const i = this.inv();
    return i?.couplePhotoUrl || this.defaultPhotoForType();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) return;

    this.uploading.set(true);
    this.svc.uploadPhoto(token, file).subscribe({
      next: (res) => {
        const url = res.data;
        if (url) {
          this.customPhotoUrl.set(url);
          if (this.inv()) {
            this.inv.update((i) => (i ? { ...i, couplePhotoUrl: url } : null));
          }
          this.toast.success("Photo mise à jour et enregistrée sur l'événement !");
        }
        this.uploading.set(false);
      },
      error: () => {
        this.toast.error("Erreur lors de l'upload de la photo.");
        this.uploading.set(false);
      },
    });
  }

  respond(status: 'CONFIRMED' | 'DECLINED'): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }

    this.submitting.set(status);
    this.svc.rsvp(token, { status }).subscribe({
      next: (res) => {
        this.inv.set(res.data!);
        this.state.set(status === 'CONFIRMED' ? 'confirmed' : 'declined');
        this.submitting.set(null);
      },
      error: (err) => {
        const msg = err?.error?.message;
        if (msg) this.errorMsg.set(msg);
        this.state.set('error');
        this.submitting.set(null);
      },
    });
  }

  private formatDate(dt: string): string {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}:${m}`;
  }
}
