import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="public-layout">
      <header class="public-header">
        <a routerLink="/" class="logo-link">
          <img src="/img/smart_invite_logo_dark_final.png" alt="Smart Invite" class="logo" />
        </a>
        <button class="lang-btn" (click)="lang.toggle()" [title]="lang.activeLang() === 'fr' ? 'Switch to English' : 'Passer en Français'">
          <img [src]="lang.activeLang() === 'fr' ? '/img/flag-fr.svg' : '/img/flag-en.svg'" class="lang-flag" alt="" />
          {{ lang.activeLang() === 'fr' ? 'FR' : 'EN' }}
        </button>
      </header>
      <main class="public-content">
        <router-outlet />
      </main>
      <footer class="public-footer">
        <p>© 2026 Smart Invite. Tous droits réservés.</p>
      </footer>
    </div>
  `,
  styles: [`
    .public-layout { display: flex; flex-direction: column; min-height: 100vh; background: #111; }
    .public-header {
      padding: 0.5rem 1rem;
      border-bottom: 1px solid #2a2a2a;
      background: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-link { display: inline-flex; text-decoration: none; }
    .logo { height: 25px; width: auto; display: block; }
    .lang-btn {
      display: flex; align-items: center; gap: 0.35rem;
      background: none; border: 1px solid #444; border-radius: 6px;
      color: #ccc; cursor: pointer; font-size: 0.78rem; padding: 0.3rem 0.7rem;
      font-family: inherit; font-weight: 700; letter-spacing: 0.05em;
      transition: border-color 0.2s, color 0.2s;
    }
    .lang-btn:hover { border-color: #c9a84c; color: #c9a84c; }
    .lang-flag { width: 18px; height: 12px; border-radius: 2px; display: block; object-fit: cover; }
    .public-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; }
    .public-footer { padding: 1rem; text-align: center; border-top: 1px solid #2a2a2a; }
    .public-footer p { color: #555; font-size: .75rem; margin: 0; }
  `],
})
export class PublicLayoutComponent {
  readonly lang = inject(LanguageService);
}
