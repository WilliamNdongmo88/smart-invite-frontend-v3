import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="public-layout">
      <header class="public-header">
        <span class="logo">✉️ Smart Invite</span>
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
    .public-header { padding: 1rem 1.5rem; border-bottom: 1px solid #2a2a2a; background: #1a1a1a; }
    .logo { color: #c9a84c; font-weight: 700; font-size: 1.1rem; }
    .public-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; }
    .public-footer { padding: 1rem; text-align: center; border-top: 1px solid #2a2a2a; }
    .public-footer p { color: #555; font-size: .75rem; margin: 0; }
  `],
})
export class PublicLayoutComponent {}
