import { Component, inject, OnInit, signal, computed, ElementRef, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '../../../core/services/invitation.service';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { PublicInvitation } from '../../../core/models/invitation.model';
import { EVENT_TYPE_LABELS } from '../../../core/models/enums.model';
import {
  WeddingDetailsTheme,
  DEFAULT_WEDDING_THEME,
} from '../../wedding-details/wedding-details-edit.model';

type PageState = 'loading' | 'ready' | 'confirmed' | 'declined' | 'error';

@Component({
  selector: 'app-rsvp-public',
  standalone: true,
  imports: [],
  templateUrl: './rsvp-public.component.html',
  styleUrls: ['./rsvp-public.component.scss'],
})
export class RsvpPublicComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly svc        = inject(InvitationService);
  private readonly authSvc    = inject(AuthService);
  private readonly eventSvc   = inject(EventService);
  private readonly toast      = inject(ToastService);
  private readonly el         = inject(ElementRef);

  state          = signal<PageState>('loading');
  inv            = signal<PublicInvitation | null>(null);
  submitting     = signal<'CONFIRMED' | 'DECLINED' | null>(null);
  uploading      = signal(false);
  customPhotoUrl = signal<string | null>(null);
  errorMsg       = signal('Ce lien est invalide ou a expiré.');

  isLoggedIn = computed(() => this.authSvc.isLoggedIn());

  readonly simulatedCouplePhoto = '/img/photoCouple.avif';

  eventType = computed<import('../../../core/models/enums.model').EventType>(() => {
    return this.inv()?.eventType || 'MARIAGE';
  });

  themeClass = computed(() => 'theme-' + this.eventType().toLowerCase());

  // ── Thème visuel (mariage uniquement) ────────────────────────────
  private readonly weddingTheme = computed<WeddingDetailsTheme>(() => {
    if (this.eventType() !== 'MARIAGE') return DEFAULT_WEDDING_THEME;
    return this.inv()?.theme ?? DEFAULT_WEDDING_THEME;
  });

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      if (this.eventType() !== 'MARIAGE') return;
      const vars = this.themeToCssVars(this.weddingTheme());
      const host = this.el.nativeElement as HTMLElement;
      Object.entries(vars).forEach(([prop, val]) => host.style.setProperty(prop, val));
    });
  }

  private themeToCssVars(t: WeddingDetailsTheme): Record<string, string> {
    const isLight = this.isColorLight(t.colorBackground);
    const ov      = t.overlayColor ?? this.hexToRgb(t.colorBackground);
    const goldRgb = this.hexToRgb(t.colorAccent);
    const cardRgb = this.hexToRgb(t.colorCardBg);
    const secRgb  = this.hexToRgb(t.colorSectionBg ?? t.colorBackground);
    return {
      '--ivory':           t.colorBackground,
      '--gold':            t.colorAccent,
      '--terracotta':      t.colorAccentSecondary,
      '--terracotta-deep': t.colorAccentDeep,
      '--ink':             t.colorText,
      '--text-secondary':  t.colorTextSecondary,
      '--card-bg':         t.colorCardBg,
      '--section-bg':      t.colorSectionBg  ?? t.colorBackground,
      '--surface':         t.colorSurface    ?? t.colorCardBg,
      '--overlay-color':   ov,
      '--gold-rgb':        goldRgb,
      '--card-bg-rgb':     cardRgb,
      '--section-bg-rgb':  secRgb,
      '--gradient-btn':    `linear-gradient(135deg, ${t.colorAccentSecondary} 0%, ${t.colorAccent} 50%, ${t.colorAccentDeep} 100%)`,
      '--nav-bg':          `rgba(${ov}, 0.96)`,
      '--border':          `${t.colorAccent}4d`,
      '--border-gold':     t.colorAccent,
      '--text-light':      isLight ? '#7a6a52' : '#8e8477',
    };
  }

  private isColorLight(hex: string): boolean {
    if (!hex?.startsWith('#')) return false;
    let c = hex.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }

  private hexToRgb(hex: string): string {
    if (!hex?.startsWith('#')) return '13, 11, 16';
    let c = hex.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16) || 13;
    const g = parseInt(c.substring(2, 4), 16) || 11;
    const b = parseInt(c.substring(4, 6), 16) || 16;
    return `${r}, ${g}, ${b}`;
  }

  eyebrowText = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE') return 'CÉLÉBRATION DE MARIAGE';
    if (t === 'CONFERENCE') return 'SOMMET & CONFÉRENCE OFFICIELLE';
    if (t === 'GALA') return 'SOIRÉE DE GALA & PRESTIGE';
    if (t === 'CEREMONIE') return 'CÉRÉMONIE OFFICIELLE';
    return this.eventTitle();
  });

  mainTitleText = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE') return 'Invitation';
    if (t === 'CONFERENCE') return 'Accréditation';
    if (t === 'GALA') return 'Invitation VIP';
    if (t === 'CEREMONIE') return 'Célébration';
    return 'Invitation';
  });

  introText = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE') return 'Nous avons le privilège et la joie de vous convier à célébrer notre union';
    if (t === 'CONFERENCE') return 'Vous êtes convié(e) à participer à cette session de haut niveau';
    if (t === 'GALA') return 'Le comité d’honneur est honoré de vous compter parmi ses invités de marque';
    if (t === 'CEREMONIE') return 'Vous êtes chaleureusement convié(e) à célébrer ce moment marquant';
    return 'Vous êtes cordialement invité(e) à célébrer ce moment';
  });

  salutationLead = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE') return "Nous serions infiniment honorés de vous compter parmi nos invités pour ce jour inoubliable.";
    if (t === 'CONFERENCE') return 'Votre accréditation nominative a été préparée avec soin pour cette conférence.';
    if (t === 'GALA') return 'Une table d’honneur vous est réservée pour cette prestigieuse réception.';
    if (t === 'CEREMONIE') return 'Votre présence rendra cette cérémonie encore plus mémorable.';
    return "Nous avons le plaisir et l'honneur de vous compter parmi nos invités d'exception.";
  });

  ornamentGlyph = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE') return '✦ 💍 ✦';
    if (t === 'CONFERENCE') return '⟨ // ⟩';
    if (t === 'GALA') return '✦ ❖ ✦';
    if (t === 'CEREMONIE') return '⚜';
    return '✦';
  });

  confirmBtnText = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE') return 'Je confirme ma présence au Mariage';
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

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }

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
