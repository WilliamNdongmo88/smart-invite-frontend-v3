import {
  Component, OnInit, OnDestroy, AfterViewInit,
  signal, computed, inject, PLATFORM_ID, ElementRef
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { ToastService } from '../../core/services/toast.service';
import {
  WeddingDetailsContent,
  WeddingDetailsEditSection,
  WEDDING_DETAILS_SECTION_LABELS,
  WeddingDetailsChapter,
  WeddingDetailsProgramItem,
  WeddingDetailsFaqItem,
  WeddingDetailsProgramDay,
  WeddingDetailsGalleryItem,
  WeddingDetailsBackgroundsContent,
  WeddingDetailsFooterContent,
} from './wedding-details-edit.model';

interface CountdownValue { days: string; hours: string; minutes: string; seconds: string; }
type PaletteKey = 'terracotta' | 'champagne';

// ── Tri chronologique des jours (sans date → en dernier) ────────────
function sortDays(days: WeddingDetailsProgramDay[]): WeddingDetailsProgramDay[] {
  return [...days].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });
}

// ── Contenu initial (source de vérité) ──────────────────────────────
const INITIAL_CONTENT: WeddingDetailsContent = {
  hero: {
    brideFirstName:  'Leatitia',
    groomFirstName:  'Christophe',
    dateLabel:       'Les 07 & 08 Août 2026',
    venueName:       'MA CABANE AU CANADA',
    venueCity:       'GOSNÉ',
    heroCatchphrase: 'Une célébration pensée comme un souvenir éternel.',
    targetDate:      '2026-08-08T14:00:00',
    maxGuests:       300,
    budget:          '15 600 XAF',
  },
  couple: {
    bridePortraitUrl: '/images/leatitia-seule.webp',
    brideBio:
      'Réservée et attentive, Leatitia est de celles qui parlent peu mais ressentent profondément. ' +
      'Elle observe, écoute et accorde sa confiance avec sincérité. Derrière son calme se cachent ' +
      'une grande sensibilité, une foi profonde et une capacité naturelle à prendre soin des autres ' +
      'avec discrétion et douceur. Dans leur histoire, elle apporte l\'équilibre, la sérénité et ' +
      'cette présence apaisante qui transforme les choses simples en moments précieux.',
    groomPortraitUrl: '/images/chris-seul.webp',
    groomBio:
      'Christophe aime les gens, les échanges et les moments partagés. Toujours entouré, toujours ' +
      'prêt à rassembler, il possède cette énergie chaleureuse qui crée du lien naturellement autour ' +
      'de lui. Mais derrière cette aisance se trouve surtout un homme profondément attentif, loyal et ' +
      'vrai. Dans leur histoire, il apporte l\'élan, la spontanéité et cette capacité à aimer ' +
      'pleinement, sans retenue.',
    coupleTagline: 'Deux façons d\'être. Une seule évidence.',
  },
  story: {
    headline:    'Une histoire construite avec le temps',
    subheadline: '« Une rencontre. Une amitié. Une évidence. Et Seize années à avancer naturellement ensemble. »',
    chapters: [
      {
        label: 'CHAPITRE I', sublabel: 'La rencontre',
        year: '2008', title: 'Une rencontre inattendue',
        caption: 'Le premier regard',
        image: '/images/chap1-veste.webp',
        paragraphs: [
          'À cette époque au sein de l\'ACR, rien ne laisse imaginer ce que deviendra leur histoire. Ils collaborent, organisent des événements et partagent un même environnement… sans savoir qu\'ils avancent déjà dans la même direction.',
        ],
      },
      {
        label: 'CHAPITRE II', sublabel: 'La complicité',
        year: '2010', title: 'L\'amitié devenue évidence',
        caption: 'Les souvenirs à deux',
        image: '/images/couple_zome_amor.webp',
        paragraphs: [
          'En 2010, leurs chemins se croisent à nouveau. Et cette fois, quelque chose change. Les échanges deviennent plus naturels. Les conversations s\'allongent. Les silences deviennent confortables, et les rires arrivent sans effort.',
          'Parler de tout et de rien devient une évidence. Et les absences… un peu plus longues, commencent à dire ce que les mots n\'avaient pas encore formulé.',
        ],
      },
      {
        label: 'CHAPITRE III', sublabel: 'Notre parcours',
        year: '2011 – 2025', title: 'Le chemin ensemble',
        caption: 'Toi et moi, pour la vie',
        image: '/images/image-1-converted.webp',
        paragraphs: [
          'Ce n\'est plus seulement une rencontre ni une évidence… C\'est une vie construite à deux. Avec le temps, nous avons appris à avancer côte à côte, à travers les jours simples comme les moments plus intenses.',
          'Notre histoire s\'est écrit naturellement, entre projets partagés, voyages, souvenirs et cette façon unique de nous comprendre. Peu à peu, nos rêves sont devenus une réalité. Et chaque étape nous a rapprochés encore plus, avec cette même complicité discrète, sincère et essentielle.',
          'Aujourd\'hui, tout ce chemin nous conduit vers ce qui vient.',
        ],
      },
      {
        label: 'CHAPITRE IV', sublabel: 'La célébration',
        year: '07 & 08 août 2026', title: 'Deux jours pour se dire OUI',
        caption: 'Le prochain chapitre',
        image: '/images/venue/domaine-vue-aerienne.webp',
        paragraphs: [
          'Tout converge désormais vers ce moment : celui de célébrer notre union avec ceux que nous aimons. Bien plus qu\'une célébration, c\'est une pause dans le temps.',
          'Un moment de gratitude pour tout ce que nous avons traversé ensemble : les saisons, les joies, les épreuves et tout ce qui a façonné notre histoire. Cette étape ne marque pas le début d\'une nouvelle histoire. Elle célèbre celle que nous écrivons déjà depuis tant d\'années, avec patience, amour et confiance.',
          'Que la tendresse et la complicité continuent de guider ce que nous avons encore à écrire ensemble.',
        ],
      },
    ],
    footer: 'Merci de faire partie de notre histoire. Merci d\'avoir traversé tant de chapitres à nos côtés. Et merci d\'être là pour écrire la suite avec nous.',
  },
  program: {
    days: [
      {
        date:     '2026-08-07',
        label:    'Vendredi 7 Août 2026 · La Veille',
        tabIcon:  '☾',
        tabDate:  '07 AOÛT',
        tabLabel: 'La Veille',
        items: [
          { icon: '♡', time: '14h – 15h',     title: 'Mariage Mairie',          desc: 'Cérémonie civile en présence des proches. Le premier « oui » officiel.' },
          { icon: '⌖', time: '15h – 15h30',   title: 'Déplacement au Thabord',  desc: 'Direction le Thabord pour la séance photos dans un cadre verdoyant.' },
          { icon: '●', time: '15h30 – 16h30', title: 'Séance Photos Thabord',   desc: 'Séance photos avec les mariés et les proches dans le magnifique parc du Thabord.' },
          { icon: '✦', time: '17h – 18h30',   title: 'Collation au Domaine',    desc: 'Un moment convivial autour d\'un verre et de petites douceurs au domaine.' },
        ],
      },
      {
        date:     '2026-08-08',
        label:    'Samedi 8 Août 2026 · Le Grand Jour',
        tabIcon:  '☼',
        tabDate:  '08 AOÛT',
        tabLabel: 'Le Jour J',
        items: [
          { icon: '♡', time: '10h00 – 11h30', title: 'Cérémonie Religieuse',       desc: 'Le moment le plus émouvant. Cérémonie solennelle entourée de tous ceux qu\'on aime.' },
          { icon: '♢', time: '12h – 14h',     title: 'Vin d\'Honneur',            desc: 'Champagne, pièces raffinées et rencontre des familles dans les jardins du domaine.' },
          { icon: '♫', time: '12h – 14h',     title: 'Le Coin des P\'tits Loups', desc: 'Un espace ludique dédié aux plus petits, avec des jeux pour leur plus grand bonheur.' },
          { icon: '◉', time: '19h – 20h',     title: 'Arrivée / Installation',     desc: 'Installation à table, retrouvailles et montée en ambiance pour la soirée.' },
        ],
      },
    ],
    footer: 'Chaque instant a été imaginé pour être vécu ensemble.',
  },
  dressCode: {
    title:       'Palette Terracotta Chic',
    description: 'Le plus important, c\'est que vous soyez à l\'aise et que vous passiez une soirée inoubliable. Pas de dress code imposé — venez comme vous vous sentez le mieux !',
    advice:      'Conseil : évitez le blanc intégral (réservé à la mariée).',
    paletteTerracotta: [
      { color: '#b65a3a', label: 'Terracotta' },
      { color: '#8d4128', label: 'Sienne' },
      { color: '#d58a67', label: 'Pêche' },
      { color: '#f2d2c2', label: 'Rosée' },
    ],
    paletteChampagne: [
      { color: '#f1e0bc', label: 'Champagne' },
      { color: '#dcc295', label: 'Doré' },
      { color: '#b99768', label: 'Miel' },
      { color: '#fff3dc', label: 'Ivoire' },
    ],
  },
  faq: {
    items: [
      { q: 'Le dress code est-il obligatoire ?',   a: 'Pas de dress code strict, mais nous comptons sur votre bon goût — habillez-vous de façon soignée et appropriée à l\'occasion. 😊' },
      { q: 'Comment confirmer ma présence ?',       a: 'Via le lien RSVP reçu sur WhatsApp. Votre réponse est enregistrée instantanément.' },
      { q: 'Quand le QR code sera-t-il utilisé ?',  a: 'Le jour J, a l\'heure du banquet.' },
    ],
  },
  rsvp: {
    title:    'Nous avons hâte de vous retrouver !',
    subtitle: 'Surveillez WhatsApp : votre invitation personnelle contient votre lien RSVP unique et toutes les informations logistiques pour cette journée inoubliable.',
  },
  gallery: {
    items: [
      { url: '/images/couple-fond-hero.webp',       caption: 'Notre complicité',        large: true  },
      { url: '/images/galerie-photo-1.webp',         caption: 'En amoureux',             large: false },
      { url: '/images/couple_en_fete.webp',          caption: 'Complices',               large: false },
      { url: '/images/invitation-couple-real.webp',  caption: 'Nos racines, notre fierté', large: false },
      { url: '/images/mr-mme-zome.webp',             caption: 'Mr & Mme',                large: false },
      { url: '/images/save-the-date-invit1.webp',    caption: 'Save the date',           large: false },
    ],
  },
  backgrounds: {
    hero:        '/images/background-section-hero.webp',
    venue:       '/images/venue/parc-etang.webp',
    quote:       '/images/fond-section-photo.webp',
    galleryBand: '/images/paralax_ce_nest_pas_tout.webp',
    rsvp:        '/images/venue/domaine-vue-aerienne.webp',
  },
  footer: {
    logoText: 'Leatitia & Christophe',
    subText:  '08 Août 2026 · Ma Cabane Au Canada · Rennes',
    loveText: 'AVEC TOUT NOTRE AMOUR ❤',
  },
};

// Deep-clone helper
function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

@Component({
  selector: 'app-wedding-details',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: 'wedding-details.component.html',
  styleUrl:    'wedding-details.component.scss',
})
export class WeddingDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly el          = inject(ElementRef);
  private readonly authService = inject(AuthService);
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly eventSvc    = inject(EventService);
  private readonly toast       = inject(ToastService);

  // ── Mode création vs édition ──────────────────────────────────────
  /** ID de l'événement existant (null = mode création) */
  readonly eventId    = signal<number | null>(null);
  readonly isEditMode = computed(() => this.eventId() !== null);
  /** Nombre max d'invités transmis depuis le wizard event-create/edit */
  readonly maxGuests  = signal<number>(300);
  /** Sauvegarde en cours vers le backend */
  saving = signal(false);
  /** Mode prévisualisation : depuis event-detail, pas d'outils d'édition */
  readonly isPreview  = signal(false);

  // ── Auth ───────────────────────────────────────────────────────────
  readonly isLoggedIn = computed(() => !this.isPreview() && this.authService.isLoggedIn());

  // ── Contenu éditable ──────────────────────────────────────────────
  content = signal<WeddingDetailsContent>(deepClone(INITIAL_CONTENT));

  readonly hero      = computed(() => this.content().hero);
  readonly couple    = computed(() => this.content().couple);
  readonly story     = computed(() => this.content().story);
  readonly program   = computed(() => this.content().program);
  readonly dressCode = computed(() => this.content().dressCode);
  readonly faq       = computed(() => this.content().faq);
  readonly rsvp      = computed(() => this.content().rsvp);
  readonly gallery   = computed(() => this.content().gallery);
  readonly bgs       = computed(() => this.content().backgrounds);
  readonly footer    = computed(() => this.content().footer);

  readonly palettes = computed<Record<PaletteKey, { color: string; label: string }[]>>(() => ({
    terracotta: this.content().dressCode.paletteTerracotta,
    champagne:  this.content().dressCode.paletteChampagne,
  }));

  // ── Edit modal ────────────────────────────────────────────────────
  editOpen      = signal(false);
  activeSection = signal<WeddingDetailsEditSection>('hero');
  readonly SECTION_LABELS = WEDDING_DETAILS_SECTION_LABELS;
  // Label/hint pour chaque fond — utilisé dans le template
  readonly BG_FIELDS: { key: keyof WeddingDetailsBackgroundsContent; label: string; hint: string }[] = [
    { key: 'hero',        label: 'Hero principal',  hint: 'Grande image de fond du haut de page' },
    { key: 'venue',       label: 'Bandeau Lieu',    hint: 'Parallax « Ma Cabane Au Canada »' },
    { key: 'quote',       label: 'Bandeau Citation',hint: 'Parallax « Il n\'y a qu\'un bonheur… »' },
    { key: 'galleryBand', label: 'Bandeau Galerie', hint: 'Bandeau de clôture de la galerie photos' },
    { key: 'rsvp',        label: 'Fond RSVP',       hint: 'Image de fond de la section RSVP finale' },
  ];
  readonly SECTIONS: WeddingDetailsEditSection[] = ['hero', 'couple', 'story', 'program', 'dressCode', 'faq', 'rsvp', 'gallery', 'backgrounds', 'footer'];
  draft = signal<WeddingDetailsContent>(deepClone(INITIAL_CONTENT));
  uploadingImage = signal<string | null>(null);

  // ── Countdown ─────────────────────────────────────────────────────
  countdown = signal<CountdownValue>({ days: '000', hours: '00', minutes: '00', seconds: '00' });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // ── Story book ────────────────────────────────────────────────────
  activeChapter = signal(0);

  // ── Programme : index du jour actif ───────────────────────────────
  activeDayIdx = signal(0);

  // ── Dress code ────────────────────────────────────────────────────
  activePalette = signal<PaletteKey>('terracotta');

  // ── Contact form ──────────────────────────────────────────────────
  contactName    = signal('');
  contactPhone   = signal('');
  contactMsg     = signal('');
  contactSent    = signal(false);
  contactSending = signal(false);

  // ── Music ─────────────────────────────────────────────────────────
  musicPlaying = signal(false);
  private audio: HTMLAudioElement | null = null;

  // ── Scroll / nav / toast ──────────────────────────────────────────
  scrollY     = signal(0);
  navScrolled = signal(false);
  showToast   = signal(false);
  private toastShown     = false;
  private scrollListener: (() => void) | null = null;
  private readonly timelineProgress = signal(0);

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // ── Détecter le mode (création vs édition) ──────────────────────
    const idParam        = this.route.snapshot.paramMap.get('id');
    const maxGuestsParam = this.route.snapshot.queryParamMap.get('maxGuests');
    const previewParam   = this.route.snapshot.queryParamMap.get('preview');

    // Mode prévisualisation depuis event-detail
    if (previewParam === 'true') {
      this.isPreview.set(true);
    }
    if (maxGuestsParam) {
      const n = Number(maxGuestsParam);
      if (!isNaN(n) && n > 0) {
        this.maxGuests.set(n);
        // Répercuter immédiatement dans le content
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
      // Charger l'événement existant pour pré-remplir les données
      this.eventSvc.findById(id).subscribe({
        next: (res) => {
          const e = res.data!;
          if (e.detailsContent || e.weddingDetailsContent) {
            this.content.set(deepClone(e.detailsContent || e.weddingDetailsContent));
          } else {
            this.content.update(c => {
              const updated = deepClone(c);
              const names = (e.concernedNames ?? '').split('&').map((s: string) => s.trim());
              updated.hero.brideFirstName  = names[0] || updated.hero.brideFirstName;
              updated.hero.groomFirstName  = names[1] || updated.hero.groomFirstName;
              updated.hero.dateLabel       = e.dateLabel || (e.eventDate
                ? new Date(e.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                : updated.hero.dateLabel);
              updated.hero.targetDate      = e.eventDate ?? updated.hero.targetDate;
              updated.hero.venueName       = e.venueName ?? e.banquetLocation ?? updated.hero.venueName;
              updated.hero.venueCity       = e.venueCity ?? updated.hero.venueCity;
              return updated;
            });
          }
        },
        error: () => {
          this.toast.error("Impossible de charger l'événement");
          this.router.navigate(['/events']);
        },
      });
    }

    // ── Charger le contenu sauvegardé en localStorage ───────────────
    const storageKey = idParam ? `si_wedding_${idParam}` : 'si_home_content';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as WeddingDetailsContent & {
          program: WeddingDetailsContent['program'] & {
            beforeDayLabel?: string;
            dayLabel?: string;
            programBefore?: WeddingDetailsProgramItem[];
            programDay?: WeddingDetailsProgramItem[];
          };
        };

        // Rétrocompatibilité : ancienne structure à 2 champs fixes → liste de jours
        if (parsed.program && !parsed.program.days) {
          const days: WeddingDetailsProgramDay[] = [];
          if (parsed.program.programBefore?.length) {
            days.push({
              date: '2026-08-07', label: parsed.program.beforeDayLabel ?? 'La Veille',
              tabIcon: '☾', tabDate: '07 AOÛT', tabLabel: 'La Veille',
              items: parsed.program.programBefore,
            });
          }
          if (parsed.program.programDay?.length) {
            days.push({
              date: '2026-08-08', label: parsed.program.dayLabel ?? 'Le Grand Jour',
              tabIcon: '☼', tabDate: '08 AOÛT', tabLabel: 'Le Jour J',
              items: parsed.program.programDay,
            });
          }
          (parsed.program as WeddingDetailsContent['program']) = {
            days: sortDays(days),
            footer: parsed.program.footer ?? '',
          };
        }

        if (!(parsed as WeddingDetailsContent).gallery) {
          (parsed as WeddingDetailsContent).gallery = deepClone(INITIAL_CONTENT.gallery);
        }
        if (!(parsed as WeddingDetailsContent).backgrounds) {
          (parsed as WeddingDetailsContent).backgrounds = deepClone(INITIAL_CONTENT.backgrounds);
        }
        if (!(parsed as WeddingDetailsContent).footer) {
          (parsed as WeddingDetailsContent).footer = deepClone(INITIAL_CONTENT.footer);
        }

        this.content.set(parsed as WeddingDetailsContent);
      } catch { /* ignore */ }
    }

    // Recaler l'index actif
    const count = this.content().program.days.length;
    if (this.activeDayIdx() >= count) this.activeDayIdx.set(Math.max(0, count - 1));

    this.startCountdown();
    this.scrollListener = () => this.onScroll();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initFadeObserver();
    // Le hero est visible dès le chargement — déclencher ses reveals immédiatement
    setTimeout(() => {
      const heroReveals = this.el.nativeElement
        .querySelectorAll('.hero-section .reveal, .hero-section .fade-up');
      heroReveals.forEach((el: Element) => el.classList.add('visible'));
    }, 50);
    this.audio = new Audio('/audio/river-flows.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.6;
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
    if (this.audio) { this.audio.pause(); this.audio = null; }
  }

  // ── Countdown ─────────────────────────────────────────────────────
  private startCountdown(): void {
    const getTarget = () => new Date(this.content().hero.targetDate).getTime();
    const update = () => {
      const diff = getTarget() - Date.now();
      if (diff <= 0) {
        this.countdown.set({ days: '000', hours: '00', minutes: '00', seconds: '00' });
        return;
      }
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

  // ── Scroll ────────────────────────────────────────────────────────
  private onScroll(): void {
    const y = window.scrollY;
    this.scrollY.set(y);
    this.navScrolled.set(y > 60);
    if (!this.toastShown && y > 500) {
      this.toastShown = true;
      setTimeout(() => this.showToast.set(true), 400);
    }
  }

  // ── Fade observer ─────────────────────────────────────────────────
  private initFadeObserver(): void {
    // Cible .fade-up ET .reveal
    const els = this.el.nativeElement.querySelectorAll('.fade-up, .reveal');

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    });

    els.forEach((el: Element) => obs.observe(el));

    // Observer dédié pour les titres de section (seuil plus bas = déclenche plus tôt)
    const titleEls = this.el.nativeElement.querySelectorAll('.section-title, .band-title, .hero-title');
    const titleObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          titleObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });

    titleEls.forEach((el: Element) => titleObs.observe(el));
  }

  // ── Parallax ──────────────────────────────────────────────────────
  parallaxY(factor: number): string {
    return `translate3d(0, ${Math.min(120, this.scrollY() * factor)}px, 0)`;
  }
  parallaxYNeg(factor: number): string {
    return `translate3d(0, ${-Math.min(120, this.scrollY() * factor)}px, 0)`;
  }

  // ── Story navigation ──────────────────────────────────────────────
  prevChapter(): void {
    const len = this.story().chapters.length;
    this.activeChapter.update(c => (c - 1 + len) % len);
  }
  nextChapter(): void {
    const len = this.story().chapters.length;
    this.activeChapter.update(c => (c + 1) % len);
  }

  // ── Music ─────────────────────────────────────────────────────────
  toggleMusic(): void {
    if (!this.audio) return;
    if (this.musicPlaying()) {
      this.audio.pause(); this.musicPlaying.set(false);
    } else {
      this.audio.play().catch(() => {}); this.musicPlaying.set(true);
    }
  }

  // ── Contact WhatsApp ──────────────────────────────────────────────
  sendContact(): void {
    if (!this.contactName() || !this.contactPhone() || !this.contactMsg()) return;
    this.contactSending.set(true);
    const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const msg = encodeURIComponent(
      `Bonjour, j'ai une question concernant le mariage de ${this.hero().brideFirstName} & ${this.hero().groomFirstName}.\n` +
      `Nom : ${this.contactName()}\nTéléphone : ${this.contactPhone()}\n` +
      `Question : ${this.contactMsg()}\nEnvoyé depuis le site le ${now}`
    );
    setTimeout(() => {
      window.location.assign(`https://wa.me/33624623647?text=${msg}`);
      this.contactSending.set(false);
      this.contactSent.set(true);
    }, 800);
  }

  resetContact(): void {
    this.contactName.set(''); this.contactPhone.set('');
    this.contactMsg.set('');  this.contactSent.set(false);
  }

  // ── Edit modal ────────────────────────────────────────────────────
  openEdit(section: WeddingDetailsEditSection = 'hero'): void {
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
    const d = deepClone(this.draft());
    // Tri chronologique à la sauvegarde
    d.program.days = sortDays(d.program.days);
    this.content.set(d);
    // Recaler l'index si un jour a été supprimé
    const count = this.content().program.days.length;
    if (this.activeDayIdx() >= count) this.activeDayIdx.set(Math.max(0, count - 1));

    // Persister en localStorage (clé propre par événement si mode édition)
    if (isPlatformBrowser(this.platformId)) {
      const key = this.eventId() ? `si_wedding_${this.eventId()}` : 'si_home_content';
      localStorage.setItem(key, JSON.stringify(this.content()));
    }

    // ── Console.log du JSON complet pour validation (appel API désactivé) ──
    console.log('══════════ WeddingDetailsContent — JSON complet ══════════');
    console.log(JSON.stringify({ eventType: 'MARIAGE', ...this.content() }, null, 2));
    console.log('══════════════════════════════════════════════════════════');

    this.closeEdit();
  }

  saveToBackend(): void {
    const c = this.content();
    const payload = {
      eventType: 'MARIAGE' as const,
      ...c,
    };
    const id = this.eventId();

    this.saving.set(true);

    if (id) {
      // Mode édition — PUT /api/events/:id
      this.eventSvc.update(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Mariage mis à jour avec succès !');
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message || 'Erreur lors de la mise à jour.');
        },
      });
    } else {
      // Mode création — POST /api/events
      this.eventSvc.create(payload).subscribe({
        next: (res) => {
          const newId = res.data!.id;
          this.eventId.set(newId);
          this.saving.set(false);
          this.toast.success('Mariage créé avec succès !');
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(`si_wedding_${newId}`, JSON.stringify(c));
          }
          this.router.navigate(['/events', newId, 'wedding'], { replaceUrl: true });
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
      this.activeDayIdx.set(0);
      if (isPlatformBrowser(this.platformId)) {
        const key = this.eventId() ? `si_wedding_${this.eventId()}` : 'si_home_content';
        localStorage.removeItem(key);
      }
      this.closeEdit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) this.closeEdit();
  }

  // ── Draft — Hero ──────────────────────────────────────────────────
  updateDraftHero(key: keyof WeddingDetailsContent['hero'], value: string): void {
    const d = deepClone(this.draft());
    (d.hero as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  /** Met à jour maxGuests et recalcule budget automatiquement */
  updateDraftMaxGuests(value: number): void {
    const d = deepClone(this.draft());
    const n = Number(value) || 0;
    d.hero.maxGuests = n;
    d.hero.budget    = n > 0 ? `${(n * 52).toLocaleString('fr-FR')} XAF` : '';
    this.draft.set(d);
  }

  // ── Draft — Couple ────────────────────────────────────────────────
  updateDraftCouple(key: keyof WeddingDetailsContent['couple'], value: string): void {
    const d = deepClone(this.draft());
    (d.couple as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  // ── Draft — Story ─────────────────────────────────────────────────
  updateDraftStory(key: 'headline' | 'subheadline' | 'footer', value: string): void {
    const d = deepClone(this.draft());
    d.story[key] = value;
    this.draft.set(d);
  }

  updateDraftChapter(idx: number, key: keyof WeddingDetailsChapter, value: string): void {
    const d = deepClone(this.draft());
    if (key === 'paragraphs') {
      d.story.chapters[idx].paragraphs = value.split('\n\n').filter(p => p.trim());
    } else {
      (d.story.chapters[idx] as unknown as Record<string, string>)[key] = value;
    }
    this.draft.set(d);
  }

  addChapter(): void {
    const d = deepClone(this.draft());
    d.story.chapters.push({
      label: `CHAPITRE ${d.story.chapters.length + 1}`,
      sublabel: '', year: '', title: '', caption: '', image: '', paragraphs: [''],
    });
    this.draft.set(d);
  }

  removeChapter(idx: number): void {
    const d = deepClone(this.draft());
    d.story.chapters.splice(idx, 1);
    this.draft.set(d);
  }

  // ── Draft — Programme (jours dynamiques) ──────────────────────────
  updateDraftProgramFooter(value: string): void {
    const d = deepClone(this.draft());
    d.program.footer = value;
    this.draft.set(d);
  }

  updateDraftDay(dayIdx: number, key: keyof WeddingDetailsProgramDay, value: string): void {
    const d = deepClone(this.draft());
    if (key === 'items') return;
    (d.program.days[dayIdx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  addDay(): void {
    const d = deepClone(this.draft());
    d.program.days.push({
      date: '', label: 'Nouveau Jour',
      tabIcon: '✦', tabDate: '', tabLabel: 'Nouveau Jour', items: [],
    });
    this.draft.set(d);
  }

  removeDay(dayIdx: number): void {
    const d = deepClone(this.draft());
    d.program.days.splice(dayIdx, 1);
    this.draft.set(d);
  }

  updateDraftDayItem(dayIdx: number, itemIdx: number, key: keyof WeddingDetailsProgramItem, value: string): void {
    const d = deepClone(this.draft());
    (d.program.days[dayIdx].items[itemIdx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  addDayItem(dayIdx: number): void {
    const d = deepClone(this.draft());
    d.program.days[dayIdx].items.push({ icon: '✦', time: '', title: '', desc: '' });
    this.draft.set(d);
  }

  removeDayItem(dayIdx: number, itemIdx: number): void {
    const d = deepClone(this.draft());
    d.program.days[dayIdx].items.splice(itemIdx, 1);
    this.draft.set(d);
  }

  // ── Draft — Dress Code ────────────────────────────────────────────
  updateDraftDressCode(key: keyof WeddingDetailsContent['dressCode'], value: string): void {
    const d = deepClone(this.draft());
    if (key === 'paletteTerracotta' || key === 'paletteChampagne') return;
    (d.dressCode as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  updateDraftPaletteItem(
    palette: 'paletteTerracotta' | 'paletteChampagne',
    idx: number,
    key: 'color' | 'label',
    value: string,
  ): void {
    const d = deepClone(this.draft());
    (d.dressCode[palette][idx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  // ── Draft — FAQ ───────────────────────────────────────────────────
  updateDraftFaqItem(idx: number, key: keyof WeddingDetailsFaqItem, value: string): void {
    const d = deepClone(this.draft());
    d.faq.items[idx][key] = value;
    this.draft.set(d);
  }

  addFaqItem(): void {
    const d = deepClone(this.draft());
    d.faq.items.push({ q: '', a: '' });
    this.draft.set(d);
  }

  removeFaqItem(idx: number): void {
    const d = deepClone(this.draft());
    d.faq.items.splice(idx, 1);
    this.draft.set(d);
  }

  // ── Draft — RSVP ──────────────────────────────────────────────────
  updateDraftRsvp(key: keyof WeddingDetailsContent['rsvp'], value: string): void {
    const d = deepClone(this.draft());
    d.rsvp[key] = value;
    this.draft.set(d);
  }

  // ── Draft — Galerie ───────────────────────────────────────────────
  updateDraftGalleryCaption(idx: number, value: string): void {
    const d = deepClone(this.draft());
    d.gallery.items[idx].caption = value;
    this.draft.set(d);
  }

  toggleDraftGalleryLarge(idx: number): void {
    const d = deepClone(this.draft());
    d.gallery.items[idx].large = !d.gallery.items[idx].large;
    this.draft.set(d);
  }

  addGalleryItem(): void {
    const d = deepClone(this.draft());
    d.gallery.items.push({ url: '', caption: '', large: false });
    this.draft.set(d);
  }

  removeGalleryItem(idx: number): void {
    const d = deepClone(this.draft());
    d.gallery.items.splice(idx, 1);
    this.draft.set(d);
  }

  async onGalleryImageChange(event: Event, idx: number): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'gallery', `gallery_${idx}`);
    const d = deepClone(this.draft());
    d.gallery.items[idx].url = url;
    this.draft.set(d);
  }

  // ── Draft — Footer ────────────────────────────────────────────
  updateDraftFooter(key: keyof WeddingDetailsFooterContent, value: string): void {
    const d = deepClone(this.draft());
    d.footer[key] = value;
    this.draft.set(d);
  }

  // ── Draft — Backgrounds ──────────────────────────────────────────
  updateDraftBackground(key: keyof WeddingDetailsBackgroundsContent, value: string): void {
    const d = deepClone(this.draft());
    d.backgrounds[key] = value;
    this.draft.set(d);
  }

  async onBackgroundImageChange(event: Event, key: keyof WeddingDetailsBackgroundsContent): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'backgrounds', `bg_${key}`);
    this.updateDraftBackground(key, url);
  }

  // ── Helpers ───────────────────────────────────────────────────────
  chapterParagraphsText(idx: number): string {
    return this.draft().story.chapters[idx].paragraphs.join('\n\n');
  }

  // ── Upload d'images vers Firebase Storage ──────────────────────────

  private uploadFile(file: File, folder: string = 'wedding', uploadKey?: string): Promise<string> {
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

  /** Upload portrait mariée */
  async onBridePortraitChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'portraits', 'bride_portrait');
    this.updateDraftCouple('bridePortraitUrl', url);
  }

  /** Upload portrait marié */
  async onGroomPortraitChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'portraits', 'groom_portrait');
    this.updateDraftCouple('groomPortraitUrl', url);
  }

  /** Upload image d'un chapitre */
  async onChapterImageChange(event: Event, idx: number): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.uploadFile(file, 'story', `chapter_${idx}`);
    this.updateDraftChapter(idx, 'image', url);
  }
}
