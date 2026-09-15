import {
  Component, OnInit, OnDestroy, signal, computed, PLATFORM_ID, inject, AfterViewInit
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ContactService } from '../../core/services/contact.service';
import { LanguageService } from '../../core/services/language.service';
import { DialCodeSelectComponent } from '../../shared/components/dial-code-select/dial-code-select.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, DialCodeSelectComponent, TranslatePipe],
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly platformId   = inject(PLATFORM_ID);
  private readonly authService  = inject(AuthService);
  private readonly contactSvc   = inject(ContactService);
  readonly lang                 = inject(LanguageService);

  // ── Story book ─────────────────────────────────────────────────────
  activeChapter = signal(0);
  readonly chapters = computed(() => {
    this.lang.translationsVersion();
    return this.lang.tArray<{
      label: string; sublabel: string; year: string;
      title: string; caption: string; content: string;
    }>('home.chapters');
  });

  // ── Programme tabs ─────────────────────────────────────────────────
  activeTab = signal<'before' | 'day'>('day');

  readonly programBefore = computed(() => {
    this.lang.translationsVersion();
    return this.lang.tArray<{ icon: string; time: string; title: string; desc: string }>('home.programBefore');
  });

  readonly programDay = computed(() => {
    this.lang.translationsVersion();
    return this.lang.tArray<{ icon: string; time: string; title: string; desc: string }>('home.programDay');
  });

  // ── FAQ ────────────────────────────────────────────────────────────
  readonly faqs = computed(() => {
    this.lang.translationsVersion();
    return this.lang.tArray<{ q: string; a: string }>('home.faqs');
  });
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
  showBackToTop = computed(() => this.scrollY() > 600);
  showToast = signal(false);
  private scrollListener: (() => void) | null = null;
  private toastShown = false;

  // ── Contact form ───────────────────────────────────────────────────
  contactName     = signal(this.authService.getName() ?? '');
  contactChannel  = signal<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  contactDialCode = signal('+237');
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

  scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    this.activeChapter.update(c => (c - 1 + this.chapters().length) % this.chapters().length);
  }
  nextChapter(): void {
    this.activeChapter.update(c => (c + 1) % this.chapters().length);
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
