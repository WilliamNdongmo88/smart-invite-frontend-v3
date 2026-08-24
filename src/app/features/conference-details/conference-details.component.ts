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
  ConferenceDetailsContent,
  ConferenceDetailsEditSection,
  CONFERENCE_DETAILS_SECTION_LABELS,
  ConferenceDetailsDayAgenda,
  ConferenceDetailsSession,
  ConferenceDetailsSpeaker,
  ConferenceDetailsSponsor,
  ConferenceDetailsFaqItem,
  ConferenceDetailsBackgroundsContent,
  ConferenceDetailsFooterContent,
  ConferenceDetailsStatItem,
  sortConferenceDays,
} from './conference-details-edit.model';

interface CountdownValue { days: string; hours: string; minutes: string; seconds: string; }

// ── Deep-clone helper ──────────────────────────────────────────────
function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

// ── Contenu initial ────────────────────────────────────────────────
const INITIAL_CONTENT: ConferenceDetailsContent = {
  hero: {
    title:        'Tech Summit 2026',
    subtitle:     'L\'innovation au cœur de demain',
    edition:      '5ème édition',
    dateLabel:    '15 & 16 Septembre 2026',
    venueName:    'PALAIS DES CONGRÈS',
    venueCity:    'ABIDJAN',
    catchphrase:  'Connecter les esprits, accélérer les idées.',
    targetDate:   '2026-09-15T09:00:00',
    maxAttendees: 500,
    budget:       '26 000 XAF',
  },

  about: {
    headline:    'Un rendez-vous incontournable',
    description:
      'Le Tech Summit réunit chaque année les acteurs clés de l\'innovation, ' +
      'de la tech et de l\'entrepreneuriat pour deux jours d\'échanges, de networking ' +
      'et d\'inspiration. Conférences plénières, ateliers pratiques, pitchs de startups ' +
      '— un programme dense conçu pour vous faire avancer.',
    stats: [
      { value: '2 500+', label: 'Participants',    icon: '👥' },
      { value: '40+',    label: 'Intervenants',    icon: '🎤' },
      { value: '20+',    label: 'Ateliers',        icon: '⚙️' },
      { value: '5',      label: 'Scènes simultanées', icon: '🎭' },
    ],
  },

  agenda: {
    footer: 'Programme susceptible d\'évoluer — consultez régulièrement cette page.',
    days: [
      {
        date:     '2026-09-15',
        label:    'Mardi 15 Septembre 2026 · Jour 1',
        tabIcon:  '📅',
        tabDate:  '15 SEPT',
        tabLabel: 'Jour 1',
        sessions: [
          { icon: '☕', time: '08h00 – 09h00', title: 'Accueil & Petit-déjeuner networking', speaker: '', room: 'Hall principal', type: 'networking' },
          { icon: '🎤', time: '09h00 – 10h30', title: 'Keynote d\'ouverture — L\'Afrique dans la révolution IA', speaker: 'Dr. Aminata Koné', room: 'Salle Plénière A', type: 'keynote' },
          { icon: '⚙️', time: '11h00 – 12h30', title: 'Atelier : Construire avec les LLMs en production', speaker: 'Yann Trésor', room: 'Workshop Room B', type: 'workshop' },
          { icon: '🥗', time: '12h30 – 14h00', title: 'Déjeuner & Networking', speaker: '', room: 'Espace restauration', type: 'break' },
          { icon: '🗣️', time: '14h00 – 15h30', title: 'Panel : Fintech & inclusion financière en Afrique subsaharienne', speaker: 'Modéré par Fatou Diallo', room: 'Salle Plénière A', type: 'panel' },
          { icon: '⚙️', time: '16h00 – 17h30', title: 'Atelier : DevOps & Infrastructure cloud Africaine', speaker: 'Marc Eto', room: 'Workshop Room C', type: 'workshop' },
        ],
      },
      {
        date:     '2026-09-16',
        label:    'Mercredi 16 Septembre 2026 · Jour 2',
        tabIcon:  '📅',
        tabDate:  '16 SEPT',
        tabLabel: 'Jour 2',
        sessions: [
          { icon: '☕', time: '08h30 – 09h00', title: 'Accueil café', speaker: '', room: 'Hall principal', type: 'networking' },
          { icon: '🎤', time: '09h00 – 10h00', title: 'Keynote : Startups deep tech — de l\'idée au scale', speaker: 'Kofi Mensah', room: 'Salle Plénière A', type: 'keynote' },
          { icon: '⚙️', time: '10h30 – 12h00', title: 'Atelier : Cybersécurité pour les PME', speaker: 'Isabelle Ngom', room: 'Workshop Room B', type: 'workshop' },
          { icon: '🥗', time: '12h00 – 13h30', title: 'Déjeuner & Demo Startups', speaker: '', room: 'Espace restauration', type: 'break' },
          { icon: '🗣️', time: '13h30 – 15h00', title: 'Panel final : Quel avenir pour la tech africaine ?', speaker: 'Tous les keynote speakers', room: 'Salle Plénière A', type: 'panel' },
          { icon: '🏆', time: '15h30 – 17h00', title: 'Cérémonie de clôture & remise des prix', speaker: '', room: 'Salle Plénière A', type: 'keynote' },
        ],
      },
    ],
  },

  speakers: {
    headline:    'Nos Intervenants',
    subheadline: 'Des experts reconnus, des visions inspirantes.',
    speakers: [
      {
        name:        'Dr. Aminata Koné',
        title:       'Directrice IA & Innovation',
        company:     'Africa AI Labs',
        bio:         'Pionnière de l\'intelligence artificielle sur le continent africain, Aminata dirige un laboratoire de recherche appliquée à l\'impact social et économique des modèles d\'IA.',
        portraitUrl: '',
        isKeynote:   true,
      },
      {
        name:        'Kofi Mensah',
        title:       'Fondateur & CEO',
        company:     'DeepScale Technologies',
        bio:         'Entrepreneur en série, Kofi a fondé trois startups deep tech de référence en Afrique de l\'Ouest. Conférencier international, il partage sa vision d\'un écosystème africain compétitif à l\'échelle mondiale.',
        portraitUrl: '',
        isKeynote:   true,
      },
      {
        name:        'Fatou Diallo',
        title:       'Analyste Fintech Senior',
        company:     'Orange Money Africa',
        bio:         'Spécialiste des paiements mobiles et de l\'inclusion financière, Fatou accompagne les acteurs institutionnels et les startups dans leur transformation numérique.',
        portraitUrl: '',
        isKeynote:   false,
      },
    ],
  },

  sponsors: {
    headline: 'Nos Partenaires',
    sponsors: [
      { name: 'TechVision Group',   logoUrl: '', level: 'platine', websiteUrl: 'https://example.com' },
      { name: 'InnoFund Africa',    logoUrl: '', level: 'or',      websiteUrl: 'https://example.com' },
      { name: 'ConnectSA Telecom',  logoUrl: '', level: 'or',      websiteUrl: 'https://example.com' },
      { name: 'StartupLab CI',      logoUrl: '', level: 'argent',  websiteUrl: 'https://example.com' },
    ],
  },

  faq: {
    items: [
      { q: 'Comment obtenir mon badge ?',          a: 'Votre badge vous sera remis à l\'accueil sur présentation de votre QR code de confirmation.' },
      { q: 'Y a-t-il un parking sur place ?',      a: 'Oui, un parking gratuit est disponible pour les participants sur présentation de votre badge.' },
      { q: 'Les sessions sont-elles enregistrées ?', a: 'Les keynotes plénières seront disponibles en replay 48h après l\'événement sur notre plateforme.' },
      { q: 'Comment exposer en tant que startup ?',  a: 'Contactez-nous via le formulaire dédié aux exposants sur notre site officiel.' },
    ],
  },

  rsvp: {
    title:    'Réservez votre place !',
    subtitle: 'Les inscriptions sont ouvertes. Votre lien personnel d\'inscription vous sera transmis par email après confirmation de votre candidature.',
  },

  gallery: {
    items: [
      { url: '', caption: 'Keynote d\'ouverture',     large: true  },
      { url: '', caption: 'Atelier pratique',         large: false },
      { url: '', caption: 'Session networking',       large: false },
      { url: '', caption: 'Remise des prix',          large: false },
      { url: '', caption: 'Stand exposition startup', large: false },
      { url: '', caption: 'Panel discussion',         large: false },
    ],
  },

  backgrounds: {
    hero:        '',
    about:       '',
    agendaBand:  '',
    rsvp:        '',
  },

  footer: {
    logoText: 'Tech Summit 2026',
    subText:  '15 & 16 Sept 2026 · Palais des Congrès · Abidjan',
    tagline:  'L\'EXCELLENCE RÉUNIT LES ESPRITS',
  },
};

// ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-conference-details',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: 'conference-details.component.html',
  styleUrl:    'conference-details.component.scss',
})
export class ConferenceDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
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
  readonly maxAttendees = signal<number>(500);
  saving = signal(false);

  // ── Auth ───────────────────────────────────────────────────────
  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());

  // ── Contenu éditable ──────────────────────────────────────────
  content = signal<ConferenceDetailsContent>(deepClone(INITIAL_CONTENT));

  readonly hero      = computed(() => this.content().hero);
  readonly about     = computed(() => this.content().about);
  readonly agenda    = computed(() => this.content().agenda);
  readonly speakers  = computed(() => this.content().speakers);
  readonly sponsors  = computed(() => this.content().sponsors);
  readonly faq       = computed(() => this.content().faq);
  readonly rsvp      = computed(() => this.content().rsvp);
  readonly gallery   = computed(() => this.content().gallery);
  readonly bgs       = computed(() => this.content().backgrounds);
  readonly footer    = computed(() => this.content().footer);

  // Sponsors filtrés par niveau
  readonly platinumSponsors = computed(() => this.content().sponsors.sponsors.filter(s => s.level === 'platine'));
  readonly goldSponsors     = computed(() => this.content().sponsors.sponsors.filter(s => s.level === 'or'));
  readonly silverSponsors   = computed(() => this.content().sponsors.sponsors.filter(s => s.level === 'argent'));

  // ── Edit modal ─────────────────────────────────────────────────
  editOpen      = signal(false);
  activeSection = signal<ConferenceDetailsEditSection>('hero');
  readonly SECTION_LABELS = CONFERENCE_DETAILS_SECTION_LABELS;
  readonly SECTIONS: ConferenceDetailsEditSection[] = [
    'hero', 'about', 'agenda', 'speakers', 'sponsors', 'faq', 'rsvp', 'gallery', 'backgrounds', 'footer',
  ];
  readonly BG_FIELDS: { key: keyof ConferenceDetailsBackgroundsContent; label: string; hint: string }[] = [
    { key: 'hero',       label: 'Hero principal',    hint: 'Grande image de fond du haut de page' },
    { key: 'about',      label: 'Bandeau À Propos',  hint: 'Image parallax de la section À Propos' },
    { key: 'agendaBand', label: 'Bandeau Agenda',    hint: 'Bandeau entre l\'agenda et les intervenants' },
    { key: 'rsvp',       label: 'Fond RSVP',         hint: 'Image de fond de la section inscription' },
  ];
  draft = signal<ConferenceDetailsContent>(deepClone(INITIAL_CONTENT));

  // ── Countdown ──────────────────────────────────────────────────
  countdown = signal<CountdownValue>({ days: '000', hours: '00', minutes: '00', seconds: '00' });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // ── Agenda ─────────────────────────────────────────────────────
  activeDayIdx = signal(0);

  // ── Scroll / nav ───────────────────────────────────────────────
  scrollY     = signal(0);
  navScrolled = signal(false);
  private scrollListener: (() => void) | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const idParam           = this.route.snapshot.paramMap.get('id');
    const maxAttendeesParam = this.route.snapshot.queryParamMap.get('maxGuests');

    if (maxAttendeesParam) {
      const n = Number(maxAttendeesParam);
      if (!isNaN(n) && n > 0) {
        this.maxAttendees.set(n);
        this.content.update(c => {
          const d = deepClone(c);
          d.hero.maxAttendees = n;
          d.hero.budget       = n > 0 ? `${(n * 52).toLocaleString('fr-FR')} XAF` : '';
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
          this.content.update(c => {
            const d = deepClone(c);
            d.hero.title       = e.title ?? d.hero.title;
            d.hero.dateLabel   = e.eventDate
              ? new Date(e.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
              : d.hero.dateLabel;
            d.hero.targetDate  = e.eventDate ?? d.hero.targetDate;
            d.hero.venueName   = e.banquetLocation ?? d.hero.venueName;
            d.footer.subText   = [
              e.eventDate ? new Date(e.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '',
              e.banquetLocation ?? '',
            ].filter(Boolean).join(' · ') || d.footer.subText;
            return d;
          });
        },
        error: () => {
          this.toast.error("Impossible de charger l'événement");
          this.router.navigate(['/events']);
        },
      });
    }

    // Charger depuis localStorage
    const storageKey = idParam ? `si_conference_${idParam}` : 'si_conference_content';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ConferenceDetailsContent;
        if (!parsed.backgrounds) parsed.backgrounds = deepClone(INITIAL_CONTENT.backgrounds);
        if (!parsed.sponsors)    parsed.sponsors    = deepClone(INITIAL_CONTENT.sponsors);
        this.content.set(parsed);
      } catch { /* ignore */ }
    }

    // Recaler l'index
    const count = this.content().agenda.days.length;
    if (this.activeDayIdx() >= count) this.activeDayIdx.set(Math.max(0, count - 1));

    this.startCountdown();
    this.scrollListener = () => this.onScroll();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initRevealObserver();
    setTimeout(() => {
      const heroEls = this.el.nativeElement.querySelectorAll('.conf-hero .reveal, .conf-hero .fade-up');
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

  // ── Scroll ────────────────────────────────────────────────────
  private onScroll(): void {
    const y = window.scrollY;
    this.scrollY.set(y);
    this.navScrolled.set(y > 60);
  }

  parallaxY(factor: number): string {
    return `translate3d(0, ${Math.min(120, this.scrollY() * factor)}px, 0)`;
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

  // ── Session type helpers ───────────────────────────────────────
  sessionTypeLabel(type: ConferenceDetailsSession['type']): string {
    const labels: Record<string, string> = {
      keynote: 'Keynote', workshop: 'Atelier',
      panel: 'Panel', networking: 'Networking', break: 'Pause',
    };
    return labels[type] ?? type;
  }

  /** Scroll fluide vers une section par son id */
  scrollTo(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── Edit modal ────────────────────────────────────────────────
  openEdit(section: ConferenceDetailsEditSection = 'hero'): void {
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
    d.agenda.days = sortConferenceDays(d.agenda.days);
    this.content.set(d);
    const count = this.content().agenda.days.length;
    if (this.activeDayIdx() >= count) this.activeDayIdx.set(Math.max(0, count - 1));

    if (isPlatformBrowser(this.platformId)) {
      const key = this.eventId() ? `si_conference_${this.eventId()}` : 'si_conference_content';
      localStorage.setItem(key, JSON.stringify(this.content()));
    }

    console.log('══════════ ConferenceDetailsContent — JSON complet ══════════');
    console.log(JSON.stringify({ eventType: 'CONFERENCE', ...this.content() }, null, 2));
    console.log('════════════════════════════════════════════════════════════');

    this.closeEdit();
  }

  resetToDefault(): void {
    if (confirm('Remettre tout le contenu d\'origine ? Cette action est irréversible.')) {
      this.content.set(deepClone(INITIAL_CONTENT));
      this.activeDayIdx.set(0);
      if (isPlatformBrowser(this.platformId)) {
        const key = this.eventId() ? `si_conference_${this.eventId()}` : 'si_conference_content';
        localStorage.removeItem(key);
      }
      this.closeEdit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) this.closeEdit();
  }

  // ── Draft — Hero ──────────────────────────────────────────────
  updateDraftHero(key: keyof ConferenceDetailsContent['hero'], value: string): void {
    const d = deepClone(this.draft());
    (d.hero as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  updateDraftMaxAttendees(value: number): void {
    const d = deepClone(this.draft());
    const n = Number(value) || 0;
    d.hero.maxAttendees = n;
    d.hero.budget       = n > 0 ? `${(n * 52).toLocaleString('fr-FR')} XAF` : '';
    this.draft.set(d);
  }

  // ── Draft — About ─────────────────────────────────────────────
  updateDraftAbout(key: 'headline' | 'description', value: string): void {
    const d = deepClone(this.draft());
    d.about[key] = value;
    this.draft.set(d);
  }

  updateDraftStat(idx: number, key: keyof ConferenceDetailsStatItem, value: string): void {
    const d = deepClone(this.draft());
    (d.about.stats[idx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  addStat(): void {
    const d = deepClone(this.draft());
    d.about.stats.push({ value: '', label: '', icon: '📊' });
    this.draft.set(d);
  }

  removeStat(idx: number): void {
    const d = deepClone(this.draft());
    d.about.stats.splice(idx, 1);
    this.draft.set(d);
  }

  // ── Draft — Agenda ────────────────────────────────────────────
  updateDraftAgendaFooter(value: string): void {
    const d = deepClone(this.draft());
    d.agenda.footer = value;
    this.draft.set(d);
  }

  updateDraftDay(dayIdx: number, key: keyof ConferenceDetailsDayAgenda, value: string): void {
    const d = deepClone(this.draft());
    if (key === 'sessions') return;
    (d.agenda.days[dayIdx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  addDay(): void {
    const d = deepClone(this.draft());
    d.agenda.days.push({ date: '', label: 'Nouveau Jour', tabIcon: '📅', tabDate: '', tabLabel: 'Jour', sessions: [] });
    this.draft.set(d);
  }

  removeDay(dayIdx: number): void {
    const d = deepClone(this.draft());
    d.agenda.days.splice(dayIdx, 1);
    this.draft.set(d);
  }

  updateDraftSession(dayIdx: number, sIdx: number, key: keyof ConferenceDetailsSession, value: string): void {
    const d = deepClone(this.draft());
    (d.agenda.days[dayIdx].sessions[sIdx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  addSession(dayIdx: number): void {
    const d = deepClone(this.draft());
    d.agenda.days[dayIdx].sessions.push({ icon: '🎤', time: '', title: '', speaker: '', room: '', type: 'keynote' });
    this.draft.set(d);
  }

  removeSession(dayIdx: number, sIdx: number): void {
    const d = deepClone(this.draft());
    d.agenda.days[dayIdx].sessions.splice(sIdx, 1);
    this.draft.set(d);
  }

  // ── Draft — Speakers ──────────────────────────────────────────
  updateDraftSpeakersHeadline(key: 'headline' | 'subheadline', value: string): void {
    const d = deepClone(this.draft());
    d.speakers[key] = value;
    this.draft.set(d);
  }

  updateDraftSpeaker(idx: number, key: keyof ConferenceDetailsSpeaker, value: string | boolean): void {
    const d = deepClone(this.draft());
    (d.speakers.speakers[idx] as unknown as Record<string, string | boolean>)[key] = value;
    this.draft.set(d);
  }

  addSpeaker(): void {
    const d = deepClone(this.draft());
    d.speakers.speakers.push({ name: '', title: '', company: '', bio: '', portraitUrl: '', isKeynote: false });
    this.draft.set(d);
  }

  removeSpeaker(idx: number): void {
    const d = deepClone(this.draft());
    d.speakers.speakers.splice(idx, 1);
    this.draft.set(d);
  }

  // ── Draft — Sponsors ──────────────────────────────────────────
  updateDraftSponsorsHeadline(value: string): void {
    const d = deepClone(this.draft());
    d.sponsors.headline = value;
    this.draft.set(d);
  }

  updateDraftSponsor(idx: number, key: keyof ConferenceDetailsSponsor, value: string): void {
    const d = deepClone(this.draft());
    (d.sponsors.sponsors[idx] as unknown as Record<string, string>)[key] = value;
    this.draft.set(d);
  }

  addSponsor(): void {
    const d = deepClone(this.draft());
    d.sponsors.sponsors.push({ name: '', logoUrl: '', level: 'argent', websiteUrl: '' });
    this.draft.set(d);
  }

  removeSponsor(idx: number): void {
    const d = deepClone(this.draft());
    d.sponsors.sponsors.splice(idx, 1);
    this.draft.set(d);
  }

  // ── Draft — FAQ ───────────────────────────────────────────────
  updateDraftFaqItem(idx: number, key: keyof ConferenceDetailsFaqItem, value: string): void {
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

  // ── Draft — RSVP ─────────────────────────────────────────────
  updateDraftRsvp(key: keyof ConferenceDetailsContent['rsvp'], value: string): void {
    const d = deepClone(this.draft());
    d.rsvp[key] = value;
    this.draft.set(d);
  }

  // ── Draft — Gallery ───────────────────────────────────────────
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
    const url = await this.readFileAsDataUrl(file);
    const d = deepClone(this.draft());
    d.gallery.items[idx].url = url;
    this.draft.set(d);
  }

  // ── Draft — Backgrounds ───────────────────────────────────────
  updateDraftBackground(key: keyof ConferenceDetailsBackgroundsContent, value: string): void {
    const d = deepClone(this.draft());
    d.backgrounds[key] = value;
    this.draft.set(d);
  }

  async onBackgroundImageChange(event: Event, key: keyof ConferenceDetailsBackgroundsContent): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.readFileAsDataUrl(file);
    this.updateDraftBackground(key, url);
  }

  // ── Draft — Speaker portrait ──────────────────────────────────
  async onSpeakerPortraitChange(event: Event, idx: number): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.readFileAsDataUrl(file);
    const d = deepClone(this.draft());
    d.speakers.speakers[idx].portraitUrl = url;
    this.draft.set(d);
  }

  // ── Draft — Sponsor logo ──────────────────────────────────────
  async onSponsorLogoChange(event: Event, idx: number): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = await this.readFileAsDataUrl(file);
    const d = deepClone(this.draft());
    d.sponsors.sponsors[idx].logoUrl = url;
    this.draft.set(d);
  }

  // ── Draft — Footer ────────────────────────────────────────────
  updateDraftFooter(key: keyof ConferenceDetailsFooterContent, value: string): void {
    const d = deepClone(this.draft());
    d.footer[key] = value;
    this.draft.set(d);
  }

  // ── Helpers ───────────────────────────────────────────────────
  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
