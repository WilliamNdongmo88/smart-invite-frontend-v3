import {
  Component, OnInit, OnDestroy, AfterViewInit,
  signal, inject, PLATFORM_ID, ElementRef
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CountdownValue { days: string; hours: string; minutes: string; seconds: string; }

type ChapterKey = 'rencontre' | 'complicite' | 'parcours' | 'celebration';
type TabKey = 'before' | 'day';
type PaletteKey = 'terracotta' | 'champagne';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef);

  // ── Countdown ──────────────────────────────────────────────────────
  readonly TARGET_DATE = new Date('2026-08-08T14:00:00').getTime();
  countdown = signal<CountdownValue>({ days: '000', hours: '00', minutes: '00', seconds: '00' });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // ── Story book ─────────────────────────────────────────────────────
  activeChapter = signal(0);
  readonly chapters = [
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
  ];

  // ── Programme ──────────────────────────────────────────────────────
  activeTab = signal<TabKey>('day');

  readonly programBefore = [
    { icon: '♡', time: '14h – 15h',    title: 'Mariage Mairie',          desc: 'Cérémonie civile en présence des proches. Le premier « oui » officiel.' },
    { icon: '⌖', time: '15h – 15h30',  title: 'Déplacement au Thabord',  desc: 'Direction le Thabord pour la séance photos dans un cadre verdoyant.' },
    { icon: '●', time: '15h30 – 16h30',title: 'Séance Photos Thabord',   desc: 'Séance photos avec les mariés et les proches dans le magnifique parc du Thabord.' },
    { icon: '✦', time: '17h – 18h30',  title: 'Collation au Domaine',    desc: 'Un moment convivial autour d\'un verre et de petites douceurs au domaine.' },
  ];

  readonly programDay = [
    { icon: '♡', time: '10h00 – 11h30', title: 'Cérémonie Religieuse',          desc: 'Le moment le plus émouvant. Cérémonie solennelle entourée de tous ceux qu\'on aime.' },
    { icon: '♢', time: '12h – 14h',     title: 'Vin d\'Honneur',                desc: 'Champagne, pièces raffinées et rencontre des familles dans les jardins du domaine.' },
    { icon: '♫', time: '12h – 14h',     title: 'Le Coin des P\'tits Loups',     desc: 'Un espace ludique dédié aux plus petits, avec des jeux pour leur plus grand bonheur.' },
    { icon: '◉', time: '19h – 20h',     title: 'Arrivée / Installation',        desc: 'Installation à table, retrouvailles et montée en ambiance pour la soirée.' },
  ];

  // ── Dress code palettes ────────────────────────────────────────────
  activePalette = signal<PaletteKey>('terracotta');
  readonly palettes: Record<PaletteKey, { color: string; label: string }[]> = {
    terracotta: [
      { color: '#b65a3a', label: 'Terracotta' },
      { color: '#8d4128', label: 'Sienne' },
      { color: '#d58a67', label: 'Pêche' },
      { color: '#f2d2c2', label: 'Rosée' },
    ],
    champagne: [
      { color: '#f1e0bc', label: 'Champagne' },
      { color: '#dcc295', label: 'Doré' },
      { color: '#b99768', label: 'Miel' },
      { color: '#fff3dc', label: 'Ivoire' },
    ],
  };

  // ── FAQ ────────────────────────────────────────────────────────────
  readonly faqs = [
    {
      q: 'Le dress code est-il obligatoire ?',
      a: 'Pas de dress code strict, mais nous comptons sur votre bon goût — habillez-vous de façon soignée et appropriée à l\'occasion. 😊',
    },
    {
      q: 'Comment confirmer ma présence ?',
      a: 'Via le lien RSVP reçu sur WhatsApp. Votre réponse est enregistrée instantanément.',
    },
  ];

  // ── Contact form ───────────────────────────────────────────────────
  contactName  = signal('');
  contactPhone = signal('');
  contactMsg   = signal('');
  contactSent    = signal(false);
  contactSending = signal(false);

  // ── Music player ───────────────────────────────────────────────────
  musicPlaying = signal(false);
  private audio: HTMLAudioElement | null = null;

  // ── Scroll / nav / toast ───────────────────────────────────────────
  scrollY      = signal(0);
  navScrolled  = signal(false);
  showToast    = signal(false);
  private toastShown = false;
  private scrollListener: (() => void) | null = null;
  private timelineProgress = signal(0);

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.startCountdown();
    this.scrollListener = () => this.onScroll();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initFadeObserver();
    this.audio = new Audio('/audio/river-flows.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.6;
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
    if (this.audio) { this.audio.pause(); this.audio = null; }
  }

  // ── Countdown ──────────────────────────────────────────────────────
  private startCountdown(): void {
    const update = () => {
      const diff = this.TARGET_DATE - Date.now();
      if (diff <= 0) {
        this.countdown.set({ days: '000', hours: '00', minutes: '00', seconds: '00' });
        return;
      }
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

  // ── Scroll ─────────────────────────────────────────────────────────
  private onScroll(): void {
    const y = window.scrollY;
    this.scrollY.set(y);
    this.navScrolled.set(y > 60);
    if (!this.toastShown && y > 500) {
      this.toastShown = true;
      setTimeout(() => this.showToast.set(true), 400);
    }
  }

  // ── IntersectionObserver fade-up ───────────────────────────────────
  private initFadeObserver(): void {
    const els = this.el.nativeElement.querySelectorAll('.fade-up');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el: Element) => obs.observe(el));
  }

  // ── Parallax ───────────────────────────────────────────────────────
  parallaxY(factor: number): string {
    return `translate3d(0, ${Math.min(120, this.scrollY() * factor)}px, 0)`;
  }

  parallaxYNeg(factor: number): string {
    return `translate3d(0, ${-Math.min(120, this.scrollY() * factor)}px, 0)`;
  }

  // ── Story navigation ───────────────────────────────────────────────
  prevChapter(): void {
    this.activeChapter.update(c => (c - 1 + this.chapters.length) % this.chapters.length);
  }
  nextChapter(): void {
    this.activeChapter.update(c => (c + 1) % this.chapters.length);
  }

  // ── Music ──────────────────────────────────────────────────────────
  toggleMusic(): void {
    if (!this.audio) return;
    if (this.musicPlaying()) {
      this.audio.pause();
      this.musicPlaying.set(false);
    } else {
      this.audio.play().catch(() => {});
      this.musicPlaying.set(true);
    }
  }

  // ── Contact WhatsApp ───────────────────────────────────────────────
  sendContact(): void {
    if (!this.contactName() || !this.contactPhone() || !this.contactMsg()) return;
    this.contactSending.set(true);
    const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const msg = encodeURIComponent(
      `Bonjour, j'ai une question concernant le mariage de Leatitia & Christophe.\n` +
      `Nom : ${this.contactName()}\n` +
      `Téléphone : ${this.contactPhone()}\n` +
      `Question : ${this.contactMsg()}\n` +
      `Envoyé depuis le site le ${now}`
    );
    setTimeout(() => {
      window.location.assign(`https://wa.me/33624623647?text=${msg}`);
      this.contactSending.set(false);
      this.contactSent.set(true);
    }, 800);
  }

  resetContact(): void {
    this.contactName.set('');
    this.contactPhone.set('');
    this.contactMsg.set('');
    this.contactSent.set(false);
  }
}
