import {
  Component, OnInit, OnDestroy, AfterViewInit,
  signal, computed, inject, PLATFORM_ID, ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { ToastService } from '../../core/services/toast.service';
import {
  CeremonieDetailsContent,
  CeremonieDetailsEditSection,
  CEREMONIE_DETAILS_SECTION_LABELS,
  CeremonieDetailsMoment,
  CeremonieDetailsGuest,
  CeremonieDetailsFaqItem,
  CeremonieDetailsBackgroundsContent,
  CeremonieDetailsFooterContent,
} from './ceremonie-details-edit.model';

interface CountdownValue { days: string; hours: string; minutes: string; seconds: string; }

function deepClone<T>(val: T): T { return JSON.parse(JSON.stringify(val)); }

// ── Contenu initial ────────────────────────────────────────────────
const INITIAL_CONTENT: CeremonieDetailsContent = {
  hero: {
    type:        'BAPTÊME',
    title:       'Baptême de Léo',
    subtitle:    'Une journée de grâce et de partage',
    dateLabel:   'Dimanche 7 Juin 2026',
    venueName:   'PAROISSE SAINT-PIERRE',
    venueCity:   'ABIDJAN',
    catchphrase: 'Avec joie et gratitude, nous partageons ce moment sacré avec vous.',
    targetDate:  '2026-06-07T10:00:00',
    maxGuests:   120,
    budget:      '6 240 XAF',
  },

  about: {
    headline:    'Un moment de grâce partagé',
    description:
      'C\'est avec un immense bonheur que nous vous invitons à célébrer avec nous ' +
      'ce moment fort en émotions. La cérémonie sera suivie d\'un repas convivial ' +
      'en famille et entre amis, dans une atmosphère chaleureuse et recueillie.',
    message:    '« Laissez venir à moi les petits enfants, ne les empêchez pas. »',
    messageIcon: '🕊️',
  },

  program: {
    headline: 'Déroulé de la Journée',
    footer:   'Le programme peut légèrement évoluer.',
    moments: [
      { icon: '⛪', time: '10h00 – 11h30', title: 'Cérémonie religieuse',    desc: 'Messe de baptême en présence de la famille et des proches à la paroisse.' },
      { icon: '📸', time: '11h30 – 12h30', title: 'Séance photos',           desc: 'Immortalisez ce moment précieux devant l\'église avec toute la famille.' },
      { icon: '🚗', time: '12h30 – 13h30', title: 'Déplacement & accueil',  desc: 'Déplacement vers le lieu de réception. Accueil avec cocktail.' },
      { icon: '🍽️', time: '13h30 – 16h30', title: 'Repas de fête',           desc: 'Déjeuner convivial avec toute la famille autour de plats généreux.' },
      { icon: '🎂', time: '16h30 – 17h00', title: 'Découpe du gâteau',       desc: 'Traditionnel gâteau de baptême suivi de chants et bénédictions.' },
      { icon: '🎉', time: '17h00 – 20h00', title: 'Ambiance & célébration',  desc: 'Musique, danse et moments de partage pour fêter dignement cet événement.' },
    ],
  },

  keyGuests: {
    headline:    'Les Personnes Clés',
    subheadline: 'Ceux qui rendent ce moment encore plus spécial.',
    guests: [
      {
        name:        'Marie & Jean Kouassi',
        role:        'Les parents',
        bio:         'Heureux parents de Léo, ils partagent avec vous cette journée bénie et vous remercient d\'être à leurs côtés.',
        portraitUrl: '',
      },
      {
        name:        'Sophie Bamba',
        role:        'La marraine',
        bio:         'Marraine attentionnée, Sophie s\'engage à accompagner Léo tout au long de son parcours de vie avec amour et bienveillance.',
        portraitUrl: '',
      },
      {
        name:        'Père Koffi Emmanuel',
        role:        'L\'officiant',
        bio:         'Pasteur de la paroisse Saint-Pierre, il célébrera la cérémonie avec ferveur et recueillement.',
        portraitUrl: '',
      },
    ],
  },

  dressCode: {
    title:       'Tenue — Blanc & Pastel',
    description: 'Pour honorer la pureté et la joie de cette cérémonie, nous vous invitons à vous habiller dans des tons clairs et élégants.',
    advice:      'Tenue correcte exigée. Évitez les couleurs trop vives ou sombres.',
    swatches: [
      { color: '#ffffff', label: 'Blanc' },
      { color: '#e8f4f8', label: 'Bleu ciel' },
      { color: '#fce8f0', label: 'Rose pastel' },
      { color: '#f0f8e8', label: 'Vert tendre' },
    ],
  },

  faq: {
    items: [
      { q: 'Y a-t-il un parking sur place ?',    a: 'Un espace parking est disponible devant la paroisse et près du lieu de réception.' },
      { q: 'Les enfants sont-ils les bienvenus ?', a: 'Absolument ! Cet événement est avant tout une fête de famille. Les enfants sont les bienvenus.' },
      { q: 'Comment confirmer ma présence ?',     a: 'Merci de confirmer votre présence via le lien WhatsApp qui vous a été transmis personnellement.' },
      { q: 'Y a-t-il des cadeaux suggérés ?',     a: 'Votre présence est le plus beau des cadeaux. Si vous souhaitez participer, une cagnotte est disponible.' },
    ],
  },

  rsvp: {
    title:    'Votre présence nous touche',
    subtitle: 'Votre invitation personnelle vous a été transmise. Merci de confirmer votre présence dès que possible afin que nous puissions vous accueillir dans les meilleures conditions.',
  },

  gallery: {
    items: [
      { url: '', caption: 'La cérémonie',           large: true  },
      { url: '', caption: 'Famille réunie',          large: false },
      { url: '', caption: 'Moments de joie',         large: false },
      { url: '', caption: 'Repas de fête',           large: false },
      { url: '', caption: 'Découpe du gâteau',       large: false },
      { url: '', caption: 'Souvenirs inoubliables',  large: false },
    ],
  },

  backgrounds: { hero: '', about: '', programBand: '', rsvp: '' },

  footer: {
    logoText: 'Baptême de Léo',
    subText:  '7 Juin 2026 · Paroisse Saint-Pierre · Abidjan',
    tagline:  'AVEC AMOUR ET GRATITUDE',
  },
};

// ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-ceremonie-details',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: 'ceremonie-details.component.html',
  styleUrl:    'ceremonie-details.component.scss',
})
export class CeremonieDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly el          = inject(ElementRef);
  private readonly authService = inject(AuthService);
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly eventSvc    = inject(EventService);
  private readonly toast       = inject(ToastService);

  readonly eventId    = signal<number | null>(null);
  readonly isEditMode = computed(() => this.eventId() !== null);
  readonly maxGuests  = signal<number>(120);
  saving = signal(false);
  readonly isPreview  = signal(false);

  readonly isLoggedIn = computed(() => !this.isPreview() && this.authService.isLoggedIn());

  content = signal<CeremonieDetailsContent>(deepClone(INITIAL_CONTENT));

  readonly hero      = computed(() => this.content().hero);
  readonly about     = computed(() => this.content().about);
  readonly program   = computed(() => this.content().program);
  readonly keyGuests = computed(() => this.content().keyGuests);
  readonly dressCode = computed(() => this.content().dressCode);
  readonly faq       = computed(() => this.content().faq);
  readonly rsvp      = computed(() => this.content().rsvp);
  readonly gallery   = computed(() => this.content().gallery);
  readonly bgs       = computed(() => this.content().backgrounds);
  readonly footer    = computed(() => this.content().footer);

  editOpen      = signal(false);
  activeSection = signal<CeremonieDetailsEditSection>('hero');
  readonly SECTION_LABELS = CEREMONIE_DETAILS_SECTION_LABELS;
  readonly SECTIONS: CeremonieDetailsEditSection[] = [
    'hero','about','program','keyGuests','dressCode','faq','rsvp','gallery','backgrounds','footer',
  ];
  readonly BG_FIELDS: { key: keyof CeremonieDetailsBackgroundsContent; label: string; hint: string }[] = [
    { key: 'hero',        label: 'Hero principal',    hint: 'Grande image de fond du haut de page' },
    { key: 'about',       label: 'Bandeau À Propos',  hint: 'Image de la section À Propos' },
    { key: 'programBand', label: 'Bandeau Programme', hint: 'Séparateur avant les personnes clés' },
    { key: 'rsvp',        label: 'Fond RSVP',         hint: 'Image de fond de la section invitation' },
  ];
  draft = signal<CeremonieDetailsContent>(deepClone(INITIAL_CONTENT));
  uploadingImage = signal<string | null>(null);

  countdown = signal<CountdownValue>({ days: '000', hours: '00', minutes: '00', seconds: '00' });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  scrollY     = signal(0);
  navScrolled = signal(false);
  private scrollListener: (() => void) | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const idParam        = this.route.snapshot.paramMap.get('id');
    const maxGuestsParam = this.route.snapshot.queryParamMap.get('maxGuests');
    const previewParam   = this.route.snapshot.queryParamMap.get('preview');

    if (previewParam === 'true') {
      this.isPreview.set(true);
    }

    if (maxGuestsParam) {
      const n = Number(maxGuestsParam);
      if (!isNaN(n) && n > 0) {
        this.maxGuests.set(n);
        this.content.update(c => {
          const d = deepClone(c);
          d.hero.maxGuests = n;
          d.hero.budget    = n > 0 ? `${(n * 52).toLocaleString('fr-FR')} XAF` : '';
          return d;
        });
      }
    }

    if (idParam) {
      const id = Number(idParam);
      this.eventId.set(id);
      this.eventSvc.findById(id).subscribe({
        next: (res) => {
          const e = res.data!;
          if (e.detailsContent || e.ceremonieDetailsContent) {
            this.content.set(deepClone(e.detailsContent || e.ceremonieDetailsContent));
          } else {
            this.content.update(c => {
              const d = deepClone(c);
              d.hero.title      = e.title ?? d.hero.title;
              d.hero.dateLabel  = e.dateLabel || (e.eventDate
                ? new Date(e.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                : d.hero.dateLabel);
              d.hero.targetDate = e.eventDate ?? d.hero.targetDate;
              d.hero.venueName  = e.venueName ?? e.banquetLocation ?? d.hero.venueName;
              d.hero.venueCity  = e.venueCity ?? d.hero.venueCity;
              return d;
            });
          }
        },
        error: () => { this.toast.error("Impossible de charger l'événement"); this.router.navigate(['/events']); },
      });
    }

    const storageKey = idParam ? `si_ceremonie_${idParam}` : 'si_ceremonie_content';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CeremonieDetailsContent;
        if (!parsed.backgrounds) parsed.backgrounds = deepClone(INITIAL_CONTENT.backgrounds);
        if (!parsed.keyGuests)   parsed.keyGuests   = deepClone(INITIAL_CONTENT.keyGuests);
        if (!parsed.dressCode)   parsed.dressCode   = deepClone(INITIAL_CONTENT.dressCode);
        this.content.set(parsed);
      } catch { /* ignore */ }
    }

    this.startCountdown();
    this.scrollListener = () => this.onScroll();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initRevealObserver();
    setTimeout(() => {
      const heroEls = this.el.nativeElement.querySelectorAll('.cere-hero .reveal, .cere-hero .fade-up');
      heroEls.forEach((el: Element) => el.classList.add('visible'));
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
  }

  private startCountdown(): void {
    const getTarget = () => new Date(this.content().hero.targetDate).getTime();
    const update = () => {
      const diff = getTarget() - Date.now();
      if (diff <= 0) { this.countdown.set({ days: '000', hours: '00', minutes: '00', seconds: '00' }); return; }
      this.countdown.set({
        days:    String(Math.floor(diff / 86_400_000)).padStart(3, '0'),
        hours:   String(Math.floor((diff % 86_400_000) / 3_600_000)).padStart(2, '0'),
        minutes: String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, '0'),
        seconds: String(Math.floor((diff % 60_000) / 1_000)).padStart(2, '0'),
      });
    };
    update();
    this.countdownInterval = setInterval(update, 1000);
  }

  private onScroll(): void {
    const y = window.scrollY;
    this.scrollY.set(y);
    this.navScrolled.set(y > 60);
  }

  scrollTo(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private initRevealObserver(): void {
    const els = this.el.nativeElement.querySelectorAll('.fade-up, .reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el: Element) => obs.observe(el));
  }

  // ── Edit modal ────────────────────────────────────────────────
  openEdit(section: CeremonieDetailsEditSection = 'hero'): void {
    this.draft.set(deepClone(this.content()));
    this.activeSection.set(section);
    this.editOpen.set(true);
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = 'hidden';
  }

  closeEdit(): void {
    this.editOpen.set(false);
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  saveEdit(): void {
    this.content.set(deepClone(this.draft()));
    if (isPlatformBrowser(this.platformId)) {
      const key = this.eventId() ? `si_ceremonie_${this.eventId()}` : 'si_ceremonie_content';
      localStorage.setItem(key, JSON.stringify(this.content()));
    }
    console.log('══════════ CeremonieDetailsContent — JSON complet ══════════');
    console.log(JSON.stringify({ eventType: 'CEREMONIE', ...this.content() }, null, 2));
    console.log('════════════════════════════════════════════════════════════');
    this.closeEdit();
  }

  saveToBackend(): void {
    const c = this.content();
    const payload = {
      eventType: 'CEREMONIE' as const,
      ...c,
    };
    const id = this.eventId();

    this.saving.set(true);

    if (id) {
      this.eventSvc.update(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Cérémonie mise à jour avec succès !');
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message || 'Erreur lors de la mise à jour.');
        },
      });
    } else {
      this.eventSvc.create(payload).subscribe({
        next: (res) => {
          const newId = res.data!.id;
          this.eventId.set(newId);
          this.saving.set(false);
          this.toast.success('Cérémonie créée avec succès !');
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(`si_ceremonie_${newId}`, JSON.stringify(c));
          }
          this.router.navigate(['/events', newId, 'ceremonie'], { replaceUrl: true });
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message || 'Erreur lors de la création.');
        },
      });
    }
  }

  resetToDefault(): void {
    if (confirm('Remettre tout le contenu d\'origine ? Cette action est irréversible.')) {
      this.content.set(deepClone(INITIAL_CONTENT));
      if (isPlatformBrowser(this.platformId)) {
        const key = this.eventId() ? `si_ceremonie_${this.eventId()}` : 'si_ceremonie_content';
        localStorage.removeItem(key);
      }
      this.closeEdit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) this.closeEdit();
  }

  // ── Draft — Hero ──────────────────────────────────────────────
  updateDraftHero(key: keyof CeremonieDetailsContent['hero'], value: string): void {
    const d = deepClone(this.draft());
    (d.hero as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  updateDraftMaxGuests(value: number): void {
    const d = deepClone(this.draft());
    const n = Number(value) || 0;
    d.hero.maxGuests = n;
    d.hero.budget    = n > 0 ? `${(n * 52).toLocaleString('fr-FR')} XAF` : '';
    this.draft.set(d);
  }

  // ── Draft — About ─────────────────────────────────────────────
  updateDraftAbout(key: keyof CeremonieDetailsContent['about'], value: string): void {
    const d = deepClone(this.draft());
    (d.about as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  // ── Draft — Programme ─────────────────────────────────────────
  updateDraftProgramHeadline(value: string): void { const d = deepClone(this.draft()); d.program.headline = value; this.draft.set(d); }
  updateDraftProgramFooter(value: string): void   { const d = deepClone(this.draft()); d.program.footer = value; this.draft.set(d); }
  updateDraftMoment(idx: number, key: keyof CeremonieDetailsMoment, value: string): void {
    const d = deepClone(this.draft());
    (d.program.moments[idx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }
  addMoment(): void { const d = deepClone(this.draft()); d.program.moments.push({ icon: '✦', time: '', title: '', desc: '' }); this.draft.set(d); }
  removeMoment(idx: number): void { const d = deepClone(this.draft()); d.program.moments.splice(idx, 1); this.draft.set(d); }

  // ── Draft — Key Guests ────────────────────────────────────────
  updateDraftKeyGuestsHeadline(key: 'headline' | 'subheadline', value: string): void {
    const d = deepClone(this.draft()); d.keyGuests[key] = value; this.draft.set(d);
  }
  updateDraftGuest(idx: number, key: keyof CeremonieDetailsGuest, value: string): void {
    const d = deepClone(this.draft());
    (d.keyGuests.guests[idx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }
  addGuest(): void { const d = deepClone(this.draft()); d.keyGuests.guests.push({ name: '', role: '', bio: '', portraitUrl: '' }); this.draft.set(d); }
  removeGuest(idx: number): void { const d = deepClone(this.draft()); d.keyGuests.guests.splice(idx, 1); this.draft.set(d); }

  // ── Draft — Dress Code ────────────────────────────────────────
  updateDraftDressCode(key: keyof CeremonieDetailsContent['dressCode'], value: string): void {
    const d = deepClone(this.draft());
    if (key === 'swatches') return;
    (d.dressCode as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }
  updateDraftSwatch(idx: number, key: 'color' | 'label', value: string): void {
    const d = deepClone(this.draft());
    (d.dressCode.swatches[idx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }
  addSwatch(): void { const d = deepClone(this.draft()); d.dressCode.swatches.push({ color: '#ffffff', label: '' }); this.draft.set(d); }
  removeSwatch(idx: number): void { const d = deepClone(this.draft()); d.dressCode.swatches.splice(idx, 1); this.draft.set(d); }

  // ── Draft — FAQ ───────────────────────────────────────────────
  updateDraftFaqItem(idx: number, key: keyof CeremonieDetailsFaqItem, value: string): void {
    const d = deepClone(this.draft()); d.faq.items[idx][key] = value; this.draft.set(d);
  }
  addFaqItem(): void { const d = deepClone(this.draft()); d.faq.items.push({ q: '', a: '' }); this.draft.set(d); }
  removeFaqItem(idx: number): void { const d = deepClone(this.draft()); d.faq.items.splice(idx, 1); this.draft.set(d); }

  // ── Draft — RSVP ─────────────────────────────────────────────
  updateDraftRsvp(key: keyof CeremonieDetailsContent['rsvp'], value: string): void {
    const d = deepClone(this.draft()); d.rsvp[key] = value; this.draft.set(d);
  }

  // ── Draft — Gallery ───────────────────────────────────────────
  updateDraftGalleryCaption(idx: number, value: string): void { const d = deepClone(this.draft()); d.gallery.items[idx].caption = value; this.draft.set(d); }
  toggleDraftGalleryLarge(idx: number): void { const d = deepClone(this.draft()); d.gallery.items[idx].large = !d.gallery.items[idx].large; this.draft.set(d); }
  addGalleryItem(): void { const d = deepClone(this.draft()); d.gallery.items.push({ url: '', caption: '', large: false }); this.draft.set(d); }
  removeGalleryItem(idx: number): void { const d = deepClone(this.draft()); d.gallery.items.splice(idx, 1); this.draft.set(d); }
  async onGalleryImageChange(event: Event, idx: number): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'gallery', `gallery_${idx}`);
    const d = deepClone(this.draft()); d.gallery.items[idx].url = url; this.draft.set(d);
  }

  // ── Draft — Backgrounds ───────────────────────────────────────
  updateDraftBackground(key: keyof CeremonieDetailsBackgroundsContent, value: string): void {
    const d = deepClone(this.draft()); d.backgrounds[key] = value; this.draft.set(d);
  }
  async onBackgroundImageChange(event: Event, key: keyof CeremonieDetailsBackgroundsContent): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'backgrounds', `bg_${key}`);
    this.updateDraftBackground(key, url);
  }

  // ── Draft — Guest portrait ────────────────────────────────────
  async onGuestPortraitChange(event: Event, idx: number): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'guests', `guest_${idx}`);
    const d = deepClone(this.draft()); d.keyGuests.guests[idx].portraitUrl = url; this.draft.set(d);
  }

  // ── Draft — Footer ────────────────────────────────────────────
  updateDraftFooter(key: keyof CeremonieDetailsFooterContent, value: string): void {
    const d = deepClone(this.draft()); d.footer[key] = value; this.draft.set(d);
  }

  // ── Upload d'images vers Firebase Storage ──────────────────────────
  private uploadFile(file: File, folder: string = 'ceremonie', uploadKey?: string): Promise<string> {
    if (uploadKey) this.uploadingImage.set(uploadKey);
    return new Promise((resolve) => {
      this.eventSvc.uploadImage(file, folder).subscribe({
        next: (res) => {
          if (uploadKey) this.uploadingImage.set(null);
          this.toast.success('Image uploadée avec succès');
          resolve(res.data!);
        },
        error: () => {
          this.readFileAsDataUrl(file).then((url) => {
            if (uploadKey) this.uploadingImage.set(null);
            resolve(url);
          }).catch(() => {
            if (uploadKey) this.uploadingImage.set(null);
            resolve('');
          });
        }
      });
    });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
