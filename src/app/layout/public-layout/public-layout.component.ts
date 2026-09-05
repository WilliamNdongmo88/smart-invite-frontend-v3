import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

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
    .public-header { padding: 0.5rem 0.5rem; border-bottom: 1px solid #2a2a2a; background: #1a1a1a; }
    .logo-link { display: inline-flex; text-decoration: none; }
    .logo { height: 25px; width: auto; display: block; }
    .public-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; }
    .public-footer { padding: 1rem; text-align: center; border-top: 1px solid #2a2a2a; }
    .public-footer p { color: #555; font-size: .75rem; margin: 0; }
  `],
})
export class PublicLayoutComponent {}
