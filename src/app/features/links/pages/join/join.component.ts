import { Component, computed, inject, OnInit, signal, ElementRef, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LinkService, LinkPreviewData } from '../../../../core/services/link.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EventService } from '../../../../core/services/event.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Invitation } from '../../../../core/models/invitation.model';
import { NotificationMode } from '../../../../core/models/enums.model';
import { DIAL_CODES } from '../../../../core/data/dial-codes';
import { DialCodeSelectComponent } from '../../../../shared/components/dial-code-select/dial-code-select.component';
import {
  WeddingDetailsTheme,
  DEFAULT_WEDDING_THEME,
} from '../../../wedding-details/wedding-details-edit.model';

type PageState = 'loading' | 'form' | 'success' | 'error';

// Alias local — identique à LinkPreviewData pour la compatibilité sessionStorage
type LinkPreview = LinkPreviewData;

type InvitationViewData = Invitation & {
  eventTitle?: string;
  eventType?: import('../../../../core/models/enums.model').EventType;
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
  imports: [ReactiveFormsModule, DialCodeSelectComponent],
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss'],
})
export class JoinComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);
  private readonly svc        = inject(LinkService);
  private readonly authSvc    = inject(AuthService);
  private readonly eventSvc   = inject(EventService);
  private readonly toast      = inject(ToastService);
  private readonly el         = inject(ElementRef);

  state          = signal<PageState>('loading');
  submitting     = signal(false);
  uploading      = signal(false);
  result         = signal<Invitation | null>(null);
  previewData    = signal<LinkPreview | null>(null);
  customPhotoUrl = signal<string | null>(null);
  errorMsg       = signal('Ce lien est invalide ou a expiré.');
  submitError    = signal<string | null>(null);

  isLoggedIn = computed(() => this.authSvc.isLoggedIn());

  readonly simulatedCouplePhoto = '/img/photoCouple.avif';

  eventType = computed<import('../../../../core/models/enums.model').EventType>(() => {
    return this.previewData()?.eventType || this.data()?.eventType || 'MARIAGE';
  });

  themeClass = computed(() => 'theme-' + this.eventType().toLowerCase());

  // ── Thème visuel (mariage uniquement) ────────────────────────────
  /** Thème actif — depuis previewData ou DEFAULT */
  private readonly weddingTheme = computed<WeddingDetailsTheme>(() => {
    if (this.eventType() !== 'MARIAGE') return DEFAULT_WEDDING_THEME;
    return this.previewData()?.theme ?? DEFAULT_WEDDING_THEME;
  });

  /** Applique les CSS vars sur le host via ElementRef (compatible toutes versions Angular) */
  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      if (this.eventType() !== 'MARIAGE') return;
      const vars = this.themeToCssVars(this.weddingTheme());
      const el = this.el.nativeElement as HTMLElement;
      Object.entries(vars).forEach(([prop, val]) => el.style.setProperty(prop, val));
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

  // ── Textes dynamiques ────────────────────────────────────────────
  eyebrowText = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE')    return 'CÉLÉBRATION DE MARIAGE';
    if (t === 'CONFERENCE') return 'SOMMET & CONFÉRENCE OFFICIELLE';
    if (t === 'GALA')       return 'SOIRÉE DE GALA & PRESTIGE';
    if (t === 'CEREMONIE')  return 'CÉRÉMONIE OFFICIELLE';
    return this.eventTitle();
  });

  mainTitleText = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE')    return 'Invitation';
    if (t === 'CONFERENCE') return 'Accréditation';
    if (t === 'GALA')       return 'Invitation VIP';
    if (t === 'CEREMONIE')  return 'Célébration';
    return 'Invitation';
  });

  introText = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE')    return 'Nous avons le privilège et la joie de vous convier à célébrer notre union';
    if (t === 'CONFERENCE') return 'Inscrivez-vous pour obtenir votre pass de conférence et badge d\u2019accès officiel';
    if (t === 'GALA')       return 'Le comité d\u2019honneur a le privilège de vous convier à cette prestigieuse réception';
    if (t === 'CEREMONIE')  return 'Nous sommes honorés de vous compter parmi nos invités d\u2019exception';
    return 'Inscrivez-vous pour recevoir votre invitation personnalisée';
  });

  ornamentGlyph = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE')    return '✦ 💍 ✦';
    if (t === 'CONFERENCE') return '⟨ // ⟩';
    if (t === 'GALA')       return '✦ ❖ ✦';
    if (t === 'CEREMONIE')  return '⚜';
    return '✦';
  });

  submitBtnText = computed(() => {
    const t = this.eventType();
    if (t === 'MARIAGE')    return 'Confirmer mon invitation';
    if (t === 'CONFERENCE') return 'Obtenir mon badge d\u2019accès';
    if (t === 'GALA')       return 'Réserver mon invitation VIP';
    if (t === 'CEREMONIE')  return 'Valider mon inscription';
    return 'Confirmer mon inscription';
  });

  defaultPhotoForType = computed(() => {
    const t = this.eventType();
    if (t === 'CONFERENCE') return '/images/background-section-hero.webp';
    if (t === 'GALA')       return '/images/couple_en_fete.webp';
    if (t === 'CEREMONIE')  return '/images/mr-mme-zome.webp';
    return this.simulatedCouplePhoto;
  });

  readonly notifOptions: { key: NotificationMode; label: string; icon: string }[] = [
    { key: 'WHATSAPP', label: 'WhatsApp',        icon: '◌' },
    { key: 'EMAIL',    label: 'Email',           icon: '✉' },
    { key: 'BOTH',     label: 'Email & WhatsApp', icon: '✦' },
  ];

  readonly dialCodes = DIAL_CODES;

  // Signal : le mode sélectionné nécessite-t-il WhatsApp ?
  needsWhatsApp = signal(true); // WHATSAPP par défaut
  // Signal : le mode sélectionné nécessite-t-il un email ?
  needsEmail = signal(false);   // WHATSAPP par défaut → pas d'email

  form = this.fb.group({
    fullName:         ['', [Validators.required, Validators.minLength(2)]],
    email:            [''],
    phoneDialCode:    ['+237'],
    phoneNumber:      [''],
    notificationMode: ['WHATSAPP' as NotificationMode],
  });

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }

    // Met à jour needsWhatsApp et needsEmail à chaque changement de mode de notification
    this.form.get('notificationMode')!.valueChanges.subscribe(mode => {
      this.needsWhatsApp.set(mode === 'WHATSAPP' || mode === 'BOTH');
      this.needsEmail.set(mode === 'EMAIL' || mode === 'BOTH');
    });

    // Mode prévisualisation locale (depuis sessionStorage)
    if (token === 'preview') {
      const raw = sessionStorage.getItem('join_preview');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as LinkPreview;
          // Si le thème n'est pas dans join_preview, on tente de le lire
          // depuis si_wedding_<id> stocké dans sessionStorage par event-detail
          if (!parsed.theme) {
            const themeRaw = sessionStorage.getItem('join_preview_theme');
            if (themeRaw) {
              try { parsed.theme = JSON.parse(themeRaw); } catch { /* ignore */ }
            }
          }
          this.previewData.set(parsed);
          this.state.set('form');
        } catch {
          this.state.set('error');
        }
      } else {
        this.state.set('error');
      }
      return;
    }

    // Mode réel — token valide, theme inclus directement dans la réponse
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
    return data?.couplePhotoUrl || data?.photoUrl || this.defaultPhotoForType();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file  = input.files[0];
    const token = this.route.snapshot.paramMap.get('token');

    this.uploading.set(true);

    const handleSuccess = (url: string) => {
      this.customPhotoUrl.set(url);
      if (this.previewData()) {
        this.previewData.update((p) => (p ? { ...p, couplePhotoUrl: url } : null));
      }
      const raw = sessionStorage.getItem('join_preview');
      if (raw) {
        try {
          const preview = JSON.parse(raw);
          preview.couplePhotoUrl = url;
          sessionStorage.setItem('join_preview', JSON.stringify(preview));
        } catch { /* ignore */ }
      }
      this.toast.success("Photo mise à jour et enregistrée sur l'événement !");
      this.uploading.set(false);
    };

    const handleError = () => {
      this.toast.error("Erreur lors de l'upload de la photo.");
      this.uploading.set(false);
    };

    if (token && token !== 'preview') {
      this.svc.uploadPhoto(token, file).subscribe({
        next:  (res) => { if (res.data) handleSuccess(res.data); else handleError(); },
        error: handleError,
      });
    } else {
      this.eventSvc.uploadImage(file, 'photos').subscribe({
        next:  (res) => { if (res.data) handleSuccess(res.data); else handleError(); },
        error: handleError,
      });
    }
  }

  submit(): void {
    const mode = this.form.get('notificationMode')?.value as NotificationMode;
    const requiresWhatsApp = mode === 'WHATSAPP' || mode === 'BOTH';
    const requiresEmail    = mode === 'EMAIL'     || mode === 'BOTH';

    // Validation manuelle : numéro WhatsApp obligatoire si le mode le nécessite
    if (requiresWhatsApp) {
      const localNumber = (this.form.get('phoneNumber')?.value ?? '').toString().trim();
      if (!localNumber) {
        this.form.get('phoneNumber')?.setErrors({ required: true });
        this.form.markAllAsTouched();
        return;
      }
    }

    // Validation manuelle : email obligatoire si le mode le nécessite
    if (requiresEmail) {
      const emailVal = (this.form.get('email')?.value ?? '').toString().trim();
      if (!emailVal) {
        this.form.get('email')?.setErrors({ required: true });
        this.form.markAllAsTouched();
        return;
      }
    }

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

    // Composition du numéro complet : indicatif + numéro local (sans zéros en tête)
    let fullPhone: string | undefined;
    if (requiresWhatsApp && value.phoneNumber) {
      const local = value.phoneNumber.toString().trim().replace(/^0+/, '');
      fullPhone = `${value.phoneDialCode}${local}`;
    } else {
      fullPhone = value.phoneNumber || undefined;
    }

    this.svc.join(token, {
      fullName:         value.fullName!,
      email:            value.email            || undefined,
      phoneNumber:      fullPhone,
      notificationMode: value.notificationMode  as NotificationMode,
    }).subscribe({
      next: (response) => {
        this.result.set(response.data!);
        this.state.set('success');
        this.submitting.set(false);
      },
      error: (error) => {
        const message    = error?.error?.message;
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
