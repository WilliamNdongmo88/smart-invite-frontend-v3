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
  GalaDetailsContent,
  GalaDetailsEditSection,
  GALA_DETAILS_SECTION_LABELS,
  GalaDetailsProgramItem,
  GalaDetailsPerformer,
  GalaDetailsFaqItem,
  GalaDetailsBackgroundsContent,
  GalaDetailsFooterContent,
} from './gala-details-edit.model';

interface CountdownValue { days: string; hours: string; minutes: string; seconds: string; }

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

// ── Contenu initial ────────────────────────────────────────────────
const INITIAL_CONTENT: GalaDetailsContent = {
  hero: {
    title:       'Gala de Charité 2026',
    subtitle:    'Une soirée d\'exception au profit de l\'éducation',
    edition:     '3ème édition',
    dateLabel:   'Samedi 28 Novembre 2026',
    venueName:   'GRAND HÔTEL IVOIRE',
    venueCity:   'ABIDJAN',
    catchphrase: 'Élégance, générosité et partage.',
    dressCode:   'Tenue de soirée exigée',
    targetDate:  '2026-11-28T19:00:00',
    maxGuests:   300,
    budget:      '15 600 XAF',
  },

  about: {
    headline:    'Une soirée au service d\'une grande cause',
    description:
      'Le Gala de Charité réunit chaque année une assemblée d\'invités de prestige autour ' +
      'd\'une cause noble. Dîner gastronomique, performances artistiques exclusives et ' +
      'ventes aux enchères se succèdent dans un cadre somptueux pour une nuit inoubliable.',
    cause:     '100% des bénéfices nets reversés au Fonds pour l\'Éducation en Côte d\'Ivoire.',
    causeIcon: '🎗️',
  },

  program: {
    headline: 'Déroulé de la Soirée',
    footer:   'Programme susceptible d\'évoluer légèrement.',
    items: [
      { icon: '🥂', time: '19h00 – 19h30', title: 'Cocktail de bienvenue',          desc: 'Accueil des invités, champagne et canapés dans le hall d\'honneur.' },
      { icon: '🎵', time: '19h30 – 20h00', title: 'Ouverture musicale',              desc: 'Performance de l\'Orchestre Philharmonique d\'Abidjan.' },
      { icon: '🍽️', time: '20h00 – 22h00', title: 'Dîner de gala',                   desc: 'Menu gastronomique 5 plats élaboré par le Chef Konan Hervé.' },
      { icon: '🎭', time: '22h00 – 22h45', title: 'Spectacle & performances',        desc: 'Showcase exclusif suivi de numéros de danse contemporaine.' },
      { icon: '🔨', time: '22h45 – 23h30', title: 'Vente aux enchères caritative',   desc: 'Œuvres d\'art et expériences uniques au profit de la fondation.' },
      { icon: '💃', time: '23h30 – 02h00', title: 'Soirée dansante',                 desc: 'DJ Set & Open bar jusqu\'aux premières heures.' },
    ],
  },

  performers: {
    headline:    'Les Artistes de la Soirée',
    subheadline: 'Des talents d\'exception pour une nuit mémorable.',
    performers: [
      {
        name:        'Josey',
        role:        'Chanteuse principale',
        bio:         'Icône de la musique ivoirienne, Josey enchantera la salle de sa voix envoûtante et de ses plus grands succès.',
        portraitUrl: '',
      },
      {
        name:        'Orchestre Philharmonique',
        role:        'Orchestre d\'ouverture',
        bio:         'L\'Orchestre Philharmonique d\'Abidjan interprétera une sélection de grands classiques pour accueillir les invités.',
        portraitUrl: '',
      },
      {
        name:        'DJ Kedjevara',
        role:        'DJ — Soirée dansante',
        bio:         'Figure incontournable de la nuit abidjanaise, DJ Kedjevara garantit une nuit festive et dansante jusqu\'à l\'aube.',
        portraitUrl: '',
      },
    ],
  },

  dressCode: {
    title:       'Dress Code — Soirée Noire & Or',
    description: 'La soirée se tient sous un thème élégant Noir & Or. Nous vous invitons à vous habiller en accord avec ce code vestimentaire pour une harmonie visuelle parfaite.',
    advice:      'Tenue de soirée exigée. Smokings, robes longues et costumes sombres recommandés.',
    swatches: [
      { color: '#1a1a1a', label: 'Noir' },
      { color: '#c9a84c', label: 'Or' },
      { color: '#2d2d2d', label: 'Charbon' },
      { color: '#d4af70', label: 'Champagne' },
    ],
  },

  faq: {
    items: [
      { q: 'Comment obtenir mon invitation ?',       a: 'Les invitations sont nominatives et transmises par voie électronique après confirmation de votre place.' },
      { q: 'Y a-t-il un parking sur place ?',        a: 'Un service de voiturier est disponible. Le parking sécurisé de l\'hôtel est inclus pour les invités.' },
      { q: 'Les animaux de compagnie sont-ils admis ?', a: 'Pour le confort de tous, les animaux de compagnie ne sont pas admis lors de la soirée.' },
      { q: 'Comment participer aux enchères ?',       a: 'Un catalogue sera remis à chaque invité à l\'entrée avec les modalités de participation.' },
    ],
  },

  rsvp: {
    title:    'Réservez votre table',
    subtitle: 'Les places sont limitées. Votre invitation personnelle vous sera transmise après confirmation de votre réservation. Contactez-nous rapidement.',
  },

  gallery: {
    items: [
      { url: '', caption: 'Cocktail de bienvenue',   large: true  },
      { url: '', caption: 'Dîner de gala',           large: false },
      { url: '', caption: 'Performances artistiques',large: false },
      { url: '', caption: 'Vente aux enchères',      large: false },
      { url: '', caption: 'Soirée dansante',         large: false },
      { url: '', caption: 'Moment de partage',       large: false },
    ],
  },

  backgrounds: {
    hero:       '',
    about:      '',
    programBand:'',
    rsvp:       '',
  },

  footer: {
    logoText: 'Gala de Charité 2026',
    subText:  '28 Nov 2026 · Grand Hôtel Ivoire · Abidjan',
    tagline:  'UNE SOIRÉE, UNE CAUSE, DES SOUVENIRS',
  },
};

// ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-gala-details',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: 'gala-details.component.html',
  styleUrl:    'gala-details.component.scss',
})
export class GalaDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly el          = inject(ElementRef);
  private readonly authService = inject(AuthService);
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly eventSvc    = inject(EventService);
  private readonly toast       = inject(ToastService);

  // ── Mode création / édition ────────────────────────────────────
  readonly eventId    = signal<number | null>(null);
  readonly isEditMode = computed(() => this.eventId() !== null);
  readonly maxGuests  = signal<number>(300);
  saving = signal(false);
  readonly isPreview  = signal(false);

  // ── Auth ───────────────────────────────────────────────────────
  readonly isLoggedIn = computed(() => !this.isPreview() && this.authService.isLoggedIn());

  // ── Contenu éditable ──────────────────────────────────────────
  content = signal<GalaDetailsContent>(deepClone(INITIAL_CONTENT));

  readonly hero       = computed(() => this.content().hero);
  readonly about      = computed(() => this.content().about);
  readonly program    = computed(() => this.content().program);
  readonly performers = computed(() => this.content().performers);
  readonly dressCode  = computed(() => this.content().dressCode);
  readonly faq        = computed(() => this.content().faq);
  readonly rsvp       = computed(() => this.content().rsvp);
  readonly gallery    = computed(() => this.content().gallery);
  readonly bgs        = computed(() => this.content().backgrounds);
  readonly footer     = computed(() => this.content().footer);

  // ── Edit modal ─────────────────────────────────────────────────
  editOpen      = signal(false);
  activeSection = signal<GalaDetailsEditSection>('hero');
  readonly SECTION_LABELS = GALA_DETAILS_SECTION_LABELS;
  readonly SECTIONS: GalaDetailsEditSection[] = [
    'hero', 'about', 'program', 'performers', 'dressCode', 'faq', 'rsvp', 'gallery', 'backgrounds', 'footer',
  ];
  readonly BG_FIELDS: { key: keyof GalaDetailsBackgroundsContent; label: string; hint: string }[] = [
    { key: 'hero',        label: 'Hero principal',   hint: 'Grande image de fond du haut de page' },
    { key: 'about',       label: 'Bandeau À Propos', hint: 'Image parallax de la section À Propos' },
    { key: 'programBand', label: 'Bandeau Programme',hint: 'Séparateur entre le programme et les artistes' },
    { key: 'rsvp',        label: 'Fond RSVP',        hint: 'Image de fond de la section réservation' },
  ];
  draft = signal<GalaDetailsContent>(deepClone(INITIAL_CONTENT));
  uploadingImage = signal<string | null>(null);

  // ── Countdown ──────────────────────────────────────────────────
  countdown = signal<CountdownValue>({ days: '000', hours: '00', minutes: '00', seconds: '00' });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // ── Scroll / nav ───────────────────────────────────────────────
  scrollY     = signal(0);
  navScrolled = signal(false);
  private scrollListener: (() => void) | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const idParam        = this.route.snapshot.paramMap.get('id');
    const maxGuestsParam = this.route.snapshot.queryParamMap.get('maxGuests');
    const previewParam   = this.route.snapshot.queryParamMap.get('preview');
    const previewDetailsParam = this.route.snapshot.queryParamMap.get('preview_details');

    if (previewParam === 'true' || previewDetailsParam === 'true') {
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
      const loader$ = (previewDetailsParam === 'true' || this.isPreview())
        ? this.eventSvc.findByIdPublic(id)
        : this.eventSvc.findById(id);
      loader$.subscribe({
        next: (res) => {
          const e = res.data!;
          if (e.detailsContent || e.galaDetailsContent) {
            this.content.set(deepClone(e.detailsContent || e.galaDetailsContent));
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
        error: () => {
          this.toast.error("Impossible de charger l'événement");
          this.router.navigate(['/events']);
        },
      });
    }

    const storageKey = idParam ? `si_gala_${idParam}` : 'si_gala_content';
    const isPreviewMode = previewParam === 'true' || previewDetailsParam === 'true';
    const saved = isPreviewMode ? null : localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GalaDetailsContent;
        if (!parsed.backgrounds) parsed.backgrounds = deepClone(INITIAL_CONTENT.backgrounds);
        if (!parsed.performers)  parsed.performers  = deepClone(INITIAL_CONTENT.performers);
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
      const heroEls = this.el.nativeElement.querySelectorAll('.gala-hero .reveal, .gala-hero .fade-up');
      heroEls.forEach((el: Element) => el.classList.add('visible'));
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
  }

  // ── Countdown ─────────────────────────────────────────────────
  private startCountdown(): void {
    const getTarget = () => new Date(this.content().hero.targetDate).getTime();
    const update = () => {
      const diff = getTarget() - Date.now();
      if (diff <= 0) { this.countdown.set({ days: '000', hours: '00', minutes: '00', seconds: '00' }); return; }
      this.countdown.set({
        days:    String(Math.floor(diff / 86_400_000)).padStart(3, '0'),
        hours:   String(Math.floor((diff % 86_400_000) / 3_600_000)).padStart(2, '0'),
        minutes: String(Math.floor((diff % 3_600_000)  / 60_000)).padStart(2, '0'),
        seconds: String(Math.floor((diff % 60_000)     / 1_000)).padStart(2, '0'),
      });
    };
    update();
    this.countdownInterval = setInterval(update, 1000);
  }

  // ── Scroll ────────────────────────────────────────────────────
  private onScroll(): void {
    const y = window.scrollY;
    this.scrollY.set(y);
    this.navScrolled.set(y > 60);
  }

  parallaxY(factor: number): string {
    return `translate3d(0, ${Math.min(120, this.scrollY() * factor)}px, 0)`;
  }

  /** Scroll fluide vers une section par son id */
  scrollTo(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Reveal observer ───────────────────────────────────────────
  private initRevealObserver(): void {
    const els = this.el.nativeElement.querySelectorAll('.fade-up, .reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el: Element) => obs.observe(el));
  }

  // ── Edit modal ────────────────────────────────────────────────
  openEdit(section: GalaDetailsEditSection = 'hero'): void {
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
      const key = this.eventId() ? `si_gala_${this.eventId()}` : 'si_gala_content';
      localStorage.setItem(key, JSON.stringify(this.content()));
    }
    console.log('══════════ GalaDetailsContent — JSON complet ══════════');
    console.log(JSON.stringify({ eventType: 'GALA', ...this.content() }, null, 2));
    console.log('═══════════════════════════════════════════════════════');
    this.closeEdit();
  }

  saveToBackend(): void {
    const c = this.content();
    const payload = {
      eventType: 'GALA' as const,
      ...c,
    };
    const id = this.eventId();

    this.saving.set(true);

    if (id) {
      this.eventSvc.update(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Gala mis à jour avec succès !');
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
          this.toast.success('Gala créé avec succès !');
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(`si_gala_${newId}`, JSON.stringify(c));
          }
          this.router.navigate(['/events', newId, 'gala'], { replaceUrl: true });
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
        const key = this.eventId() ? `si_gala_${this.eventId()}` : 'si_gala_content';
        localStorage.removeItem(key);
      }
      this.closeEdit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) this.closeEdit();
  }

  // ── Draft — Hero ──────────────────────────────────────────────
  updateDraftHero(key: keyof GalaDetailsContent['hero'], value: string): void {
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
  updateDraftAbout(key: keyof GalaDetailsContent['about'], value: string): void {
    const d = deepClone(this.draft());
    (d.about as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  // ── Draft — Programme ─────────────────────────────────────────
  updateDraftProgramHeadline(value: string): void {
    const d = deepClone(this.draft()); d.program.headline = value; this.draft.set(d);
  }
  updateDraftProgramFooter(value: string): void {
    const d = deepClone(this.draft()); d.program.footer = value; this.draft.set(d);
  }
  updateDraftProgramItem(idx: number, key: keyof GalaDetailsProgramItem, value: string): void {
    const d = deepClone(this.draft());
    (d.program.items[idx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }
  addProgramItem(): void {
    const d = deepClone(this.draft());
    d.program.items.push({ icon: '✦', time: '', title: '', desc: '' });
    this.draft.set(d);
  }
  removeProgramItem(idx: number): void {
    const d = deepClone(this.draft()); d.program.items.splice(idx, 1); this.draft.set(d);
  }

  // ── Draft — Performers ────────────────────────────────────────
  updateDraftPerformersHeadline(key: 'headline' | 'subheadline', value: string): void {
    const d = deepClone(this.draft()); d.performers[key] = value; this.draft.set(d);
  }
  updateDraftPerformer(idx: number, key: keyof GalaDetailsPerformer, value: string): void {
    const d = deepClone(this.draft());
    (d.performers.performers[idx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }
  addPerformer(): void {
    const d = deepClone(this.draft());
    d.performers.performers.push({ name: '', role: '', bio: '', portraitUrl: '' });
    this.draft.set(d);
  }
  removePerformer(idx: number): void {
    const d = deepClone(this.draft()); d.performers.performers.splice(idx, 1); this.draft.set(d);
  }

  // ── Draft — Dress Code ────────────────────────────────────────
  updateDraftDressCode(key: keyof GalaDetailsContent['dressCode'], value: string): void {
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
  addSwatch(): void {
    const d = deepClone(this.draft()); d.dressCode.swatches.push({ color: '#000000', label: '' }); this.draft.set(d);
  }
  removeSwatch(idx: number): void {
    const d = deepClone(this.draft()); d.dressCode.swatches.splice(idx, 1); this.draft.set(d);
  }

  // ── Draft — FAQ ───────────────────────────────────────────────
  updateDraftFaqItem(idx: number, key: keyof GalaDetailsFaqItem, value: string): void {
    const d = deepClone(this.draft()); d.faq.items[idx][key] = value; this.draft.set(d);
  }
  addFaqItem(): void {
    const d = deepClone(this.draft()); d.faq.items.push({ q: '', a: '' }); this.draft.set(d);
  }
  removeFaqItem(idx: number): void {
    const d = deepClone(this.draft()); d.faq.items.splice(idx, 1); this.draft.set(d);
  }

  // ── Draft — RSVP ─────────────────────────────────────────────
  updateDraftRsvp(key: keyof GalaDetailsContent['rsvp'], value: string): void {
    const d = deepClone(this.draft());
    d.rsvp[key] = value;
    this.draft.set(d);
  }

  // ── Draft — Gallery ───────────────────────────────────────────
  updateDraftGalleryCaption(idx: number, value: string): void {
    const d = deepClone(this.draft()); d.gallery.items[idx].caption = value; this.draft.set(d);
  }
  toggleDraftGalleryLarge(idx: number): void {
    const d = deepClone(this.draft()); d.gallery.items[idx].large = !d.gallery.items[idx].large; this.draft.set(d);
  }
  addGalleryItem(): void {
    const d = deepClone(this.draft()); d.gallery.items.push({ url: '', caption: '', large: false }); this.draft.set(d);
  }
  removeGalleryItem(idx: number): void {
    const d = deepClone(this.draft()); d.gallery.items.splice(idx, 1); this.draft.set(d);
  }
  async onGalleryImageChange(event: Event, idx: number): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'gallery', `gallery_${idx}`);
    const d = deepClone(this.draft()); d.gallery.items[idx].url = url; this.draft.set(d);
  }

  // ── Draft — Backgrounds ───────────────────────────────────────
  updateDraftBackground(key: keyof GalaDetailsBackgroundsContent, value: string): void {
    const d = deepClone(this.draft()); d.backgrounds[key] = value; this.draft.set(d);
  }
  async onBackgroundImageChange(event: Event, key: keyof GalaDetailsBackgroundsContent): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'backgrounds', `bg_${key}`);
    this.updateDraftBackground(key, url);
  }

  // ── Draft — Performer portrait ────────────────────────────────
  async onPerformerPortraitChange(event: Event, idx: number): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'performers', `performer_${idx}`);
    const d = deepClone(this.draft()); d.performers.performers[idx].portraitUrl = url; this.draft.set(d);
  }

  // ── Draft — Footer ────────────────────────────────────────────
  updateDraftFooter(key: keyof GalaDetailsFooterContent, value: string): void {
    const d = deepClone(this.draft()); d.footer[key] = value; this.draft.set(d);
  }

  // ── Upload d'images vers Firebase Storage ──────────────────────────
  private uploadFile(file: File, folder: string = 'gala', uploadKey?: string): Promise<string> {
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
