import {
  Component, OnInit, OnDestroy, signal, PLATFORM_ID, inject, AfterViewInit, ElementRef, ViewChildren, QueryList
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CountdownValue { days: string; hours: string; minutes: string; seconds: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  // ── Countdown ──────────────────────────────────────────────────────
  countdown = signal<CountdownValue>({ days: '000', hours: '00', minutes: '00', seconds: '00' });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // ── Story book ─────────────────────────────────────────────────────
  activeChapter = signal(0);
  chapters = [
    {
      label: 'CHAPITRE I', sublabel: 'Le problème',
      year: '2024', title: 'Des invitations perdues dans les emails',
      caption: 'Le chaos des invitations',
      content: 'Chaque organisateur d\'événement a vécu ce cauchemar : des centaines d\'emails envoyés, des réponses éparpillées, des invités qui n\'ont jamais reçu leur invitation. La gestion manuelle des invitations est chronophage, source d\'erreurs et de stress.',
    },
    {
      label: 'CHAPITRE II', sublabel: 'La vision',
      year: '2024', title: 'Une plateforme pensée pour l\'élégance',
      caption: 'La solution intelligente',
      content: 'Smart Invite est né d\'une conviction simple : chaque événement mérite une gestion à la hauteur de son importance. Nous avons conçu une plateforme qui allie puissance technologique et élégance visuelle pour transformer l\'expérience de l\'organisateur comme de l\'invité.',
    },
    {
      label: 'CHAPITRE III', sublabel: 'Les fonctionnalités',
      year: '2025', title: 'Tout ce dont vous avez besoin',
      caption: 'Fonctionnalités complètes',
      content: 'Créez vos événements en quelques minutes, importez vos listes d\'invités, générez des invitations personnalisées avec QR code, suivez les confirmations en temps réel, et gérez le check-in le jour J avec notre application dédiée. Smart Invite couvre tout le cycle de vie de votre événement.',
    },
    {
      label: 'CHAPITRE IV', sublabel: 'Votre événement',
      year: '2025', title: 'Prêt à créer votre premier événement ?',
      caption: 'Commencez maintenant',
      content: 'Rejoignez les organisateurs qui font confiance à Smart Invite pour leurs mariages, galas, conférences et célébrations. Créez votre compte gratuitement et découvrez comment transformer votre prochain événement en une expérience inoubliable.',
    },
  ];

  // ── Programme tabs ─────────────────────────────────────────────────
  activeTab = signal<'before' | 'day'>('day');

  programBefore = [
    { icon: '✦', time: 'J-30', title: 'Création de l\'événement', desc: 'Configurez votre événement, personnalisez votre page d\'invitation et définissez les détails.' },
    { icon: '♡', time: 'J-21', title: 'Import des invités', desc: 'Importez votre liste d\'invités via Excel ou ajoutez-les manuellement un par un.' },
    { icon: '◉', time: 'J-14', title: 'Envoi des invitations', desc: 'Envoyez les invitations personnalisées par email et/ou WhatsApp en un clic.' },
    { icon: '♢', time: 'J-7', title: 'Suivi des confirmations', desc: 'Consultez en temps réel qui a confirmé, qui est en attente, qui a décliné.' },
  ];

  programDay = [
    { icon: '⌖', time: 'Matin', title: 'Préparation du check-in', desc: 'Activez le mode check-in et assignez vos agents à l\'entrée de l\'événement.' },
    { icon: '♫', time: 'Accueil', title: 'Scan des QR codes', desc: 'Chaque invité présente son QR code. Validation instantanée, détection des doublons.' },
    { icon: '●', time: 'En direct', title: 'Tableau de bord live', desc: 'Suivez l\'affluence en temps réel : valides, doublons, invalides, total présents.' },
    { icon: '✦', time: 'Après', title: 'Rapport complet', desc: 'Exportez le rapport de présence avec toutes les statistiques de votre événement.' },
  ];

  // ── FAQ ────────────────────────────────────────────────────────────
  faqs = [
    { q: 'Smart Invite est-il gratuit ?', a: 'Smart Invite propose une offre d\'essai gratuite. Des plans payants sont disponibles pour les événements de grande envergure avec des fonctionnalités avancées.' },
    { q: 'Combien d\'invités puis-je gérer ?', a: 'Il n\'y a pas de limite stricte. La plateforme est conçue pour gérer des événements de 10 à plusieurs milliers d\'invités.' },
    { q: 'Les invités ont-ils besoin d\'un compte ?', a: 'Non. Les invités reçoivent un lien unique et peuvent confirmer leur présence sans créer de compte.' },
    { q: 'Le check-in fonctionne-t-il hors ligne ?', a: 'L\'application de check-in nécessite une connexion internet pour synchroniser les données en temps réel.' },
  ];

  // ── Palette dress code (réutilisé pour "thème design") ─────────────
  activePalette = signal<'dark' | 'light'>('dark');
  palettes = {
    dark: [
      { color: '#111111', label: 'Onyx' },
      { color: '#1a1a1a', label: 'Charbon' },
      { color: '#c9a84c', label: 'Or' },
      { color: '#2a2a2a', label: 'Graphite' },
    ],
    light: [
      { color: '#ffffff', label: 'Blanc' },
      { color: '#f5f0e8', label: 'Ivoire' },
      { color: '#c9a84c', label: 'Or' },
      { color: '#888888', label: 'Argent' },
    ],
  };

  // ── Parallax / scroll ──────────────────────────────────────────────
  scrollY = signal(0);
  navScrolled = signal(false);
  showToast = signal(false);
  private scrollListener: (() => void) | null = null;
  private toastShown = false;

  // ── Contact form ───────────────────────────────────────────────────
  contactName = signal('');
  contactMsg = signal('');
  contactSent = signal(false);
  contactSending = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.startCountdown();
    this.scrollListener = () => this.onScroll();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initFadeObserver();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
  }

  private startCountdown(): void {
    const target = new Date('2026-01-01T00:00:00').getTime();
    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        this.countdown.set({ days: '000', hours: '00', minutes: '00', seconds: '00' });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      this.countdown.set({
        days: String(d).padStart(3, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      });
    };
    update();
    this.countdownInterval = setInterval(update, 1000);
  }

  private onScroll(): void {
    const y = window.scrollY;
    this.scrollY.set(y);
    this.navScrolled.set(y > 60);
    if (!this.toastShown && y > 400) {
      this.toastShown = true;
      setTimeout(() => this.showToast.set(true), 300);
    }
  }

  private initFadeObserver(): void {
    const els = document.querySelectorAll('.fade-up');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
  }

  parallaxY(factor: number): string {
    return `translate3d(0, ${Math.min(120, this.scrollY() * factor)}px, 0)`;
  }

  prevChapter(): void {
    this.activeChapter.update(c => (c - 1 + this.chapters.length) % this.chapters.length);
  }
  nextChapter(): void {
    this.activeChapter.update(c => (c + 1) % this.chapters.length);
  }

  sendContact(): void {
    if (!this.contactName() || !this.contactMsg()) return;
    this.contactSending.set(true);
    const msg = encodeURIComponent(
      `Bonjour, j'ai une question concernant Smart Invite.\nNom: ${this.contactName()}\nMessage: ${this.contactMsg()}\nEnvoyé depuis le site le ${new Date().toLocaleDateString('fr-FR')}`
    );
    setTimeout(() => {
      window.open(`https://wa.me/237600000000?text=${msg}`, '_blank');
      this.contactSending.set(false);
      this.contactSent.set(true);
    }, 800);
  }

  resetContact(): void {
    this.contactName.set('');
    this.contactMsg.set('');
    this.contactSent.set(false);
  }
}
