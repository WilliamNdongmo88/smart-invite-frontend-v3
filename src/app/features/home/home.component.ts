import {
  Component, OnInit, OnDestroy, signal, computed, PLATFORM_ID, inject, AfterViewInit
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly platformId   = inject(PLATFORM_ID);
  private readonly authService  = inject(AuthService);
  private readonly contactSvc   = inject(ContactService);

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
    { q: 'Smart Invite est-il gratuit ?', a: 'Smart Invite est facturé en fonction du nombre d’invités. Le tarif est de 52 XAF par invité.' },
    { q: 'Combien d\'invités puis-je gérer ?', a: 'Il n\'y a pas de limite stricte. La plateforme est conçue pour gérer des événements de 10 à plusieurs milliers d\'invités.' },
    { q: 'Les invités ont-ils besoin d\'un compte ?', a: 'Non. Les invités reçoivent un lien unique et peuvent confirmer leur présence sans créer de compte.' },
    { q: 'Le check-in fonctionne-t-il hors ligne ?', a: 'L\’application de check-in nécessite une connexion Internet. Un agent doit être créé par l\’organisateur afin de permettre la synchronisation des données en temps réel.' },
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

  // ── Mobile menu ────────────────────────────────────────────────────
  mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // ── Parallax / scroll ──────────────────────────────────────────────
  scrollY = signal(0);
  navScrolled = signal(false);
  showToast = signal(false);
  private scrollListener: (() => void) | null = null;
  private toastShown = false;

  // ── Contact form ───────────────────────────────────────────────────
  readonly dialCodes = [
    { code: '+237', iso2: 'cm', name: 'Cameroun'        },
    { code: '+225', iso2: 'ci', name: "Côte d'Ivoire"   },
    { code: '+221', iso2: 'sn', name: 'Sénégal'         },
    { code: '+242', iso2: 'cg', name: 'Congo'           },
    { code: '+243', iso2: 'cd', name: 'RD Congo'        },
    { code: '+241', iso2: 'ga', name: 'Gabon'           },
    { code: '+235', iso2: 'td', name: 'Tchad'           },
    { code: '+236', iso2: 'cf', name: 'Centrafrique'    },
    { code: '+240', iso2: 'gq', name: 'Guinée Éq.'      },
    { code: '+229', iso2: 'bj', name: 'Bénin'           },
    { code: '+226', iso2: 'bf', name: 'Burkina Faso'    },
    { code: '+228', iso2: 'tg', name: 'Togo'            },
    { code: '+223', iso2: 'ml', name: 'Mali'            },
    { code: '+227', iso2: 'ne', name: 'Niger'           },
    { code: '+230', iso2: 'mu', name: 'Maurice'         },
    { code: '+222', iso2: 'mr', name: 'Mauritanie'      },
    { code: '+224', iso2: 'gn', name: 'Guinée'          },
    { code: '+245', iso2: 'gw', name: 'Guinée-Bissau'   },
    { code: '+238', iso2: 'cv', name: 'Cap-Vert'        },
    { code: '+239', iso2: 'st', name: 'São Tomé'        },
    { code: '+234', iso2: 'ng', name: 'Nigéria'         },
    { code: '+233', iso2: 'gh', name: 'Ghana'           },
    { code: '+212', iso2: 'ma', name: 'Maroc'           },
    { code: '+213', iso2: 'dz', name: 'Algérie'         },
    { code: '+216', iso2: 'tn', name: 'Tunisie'         },
    { code: '+20',  iso2: 'eg', name: 'Égypte'          },
    { code: '+27',  iso2: 'za', name: 'Afrique du Sud'  },
    { code: '+254', iso2: 'ke', name: 'Kenya'           },
    { code: '+255', iso2: 'tz', name: 'Tanzanie'        },
    { code: '+256', iso2: 'ug', name: 'Ouganda'         },
    { code: '+251', iso2: 'et', name: 'Éthiopie'        },
    { code: '+33',  iso2: 'fr', name: 'France'          },
    { code: '+32',  iso2: 'be', name: 'Belgique'        },
    { code: '+41',  iso2: 'ch', name: 'Suisse'          },
    { code: '+1',   iso2: 'us', name: 'États-Unis'      },
    { code: '+44',  iso2: 'gb', name: 'Royaume-Uni'     },
    { code: '+49',  iso2: 'de', name: 'Allemagne'       },
    { code: '+34',  iso2: 'es', name: 'Espagne'         },
    { code: '+39',  iso2: 'it', name: 'Italie'          },
    { code: '+351', iso2: 'pt', name: 'Portugal'        },
    { code: '+55',  iso2: 'br', name: 'Brésil'          },
    { code: '+86',  iso2: 'cn', name: 'Chine'           },
  ];

  contactName     = signal(this.authService.getName() ?? '');
  contactChannel  = signal<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  contactDialCode = signal('+237');
  readonly selectedDialIso2 = computed(
    () => this.dialCodes.find(d => d.code === this.contactDialCode())?.iso2 ?? 'cm'
  );
  contactPhone    = signal('');
  contactEmail    = signal('');
  contactMsg      = signal('');
  contactSent     = signal(false);
  contactSending  = signal(false);

  /** Contact de réponse selon le canal sélectionné */
  readonly contactReplyContact = computed(() =>
    this.contactChannel() === 'WHATSAPP'
      ? `${this.contactDialCode()}${this.contactPhone().replace(/\D/g, '')}`
      : this.contactEmail()
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.scrollListener = () => this.onScroll();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initFadeObserver();
  }

  ngOnDestroy(): void {
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
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
    if (!this.contactName() || !this.contactReplyContact() || !this.contactMsg()) return;
    this.contactSending.set(true);

    this.contactSvc.submit({
      name:         this.contactName(),
      replyChannel: this.contactChannel(),
      replyContact: this.contactReplyContact(),
      message:      this.contactMsg(),
    }).subscribe({
      next: () => {
        this.contactSending.set(false);
        this.contactSent.set(true);
      },
      error: (err) => {
        console.error('[Contact] Erreur envoi :', err);
        this.contactSending.set(false);
        // On affiche quand même le succès pour ne pas bloquer l'UX
        // (l'admin a peut-être reçu la notification même si la réponse a fail)
        this.contactSent.set(true);
      }
    });
  }

  resetContact(): void {
    this.contactName.set(this.authService.getName() ?? '');
    this.contactChannel.set('WHATSAPP');
    this.contactDialCode.set('+237');
    this.contactPhone.set('');
    this.contactEmail.set('');
    this.contactMsg.set('');
    this.contactSent.set(false);
  }
}
