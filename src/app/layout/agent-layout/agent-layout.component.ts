import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [RouterOutlet, TranslatePipe],
  template: `
    <div class="agent-layout">
      <header class="agent-header">
        <!-- Logo identique à la home -->
        <span class="logo">
          <span class="logo-icon">✦</span>
          Smart<span class="logo-gold">Invite</span>
        </span>
        <!-- Bouton déconnexion : icône uniquement -->
        <button class="logout-btn" (click)="logout()" [title]="'layout.agent.logout' | translate">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </header>
      <main class="agent-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .agent-layout { display: flex; flex-direction: column; min-height: 100vh; background: #111; }
    .agent-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1.25rem; background: #1a1a1a; border-bottom: 1px solid #2a2a2a;
      /* Empêche tout débordement horizontal */
      overflow: hidden;
    }
    .logo {
      display: flex; align-items: center; gap: .3rem;
      font-size: 1.1rem; font-weight: 700; color: #fff;
      white-space: nowrap;
    }
    .logo-icon { color: #c9a84c; font-size: 1rem; }
    .logo-gold { color: #c9a84c; }
    /* Bouton icône compact */
    .logout-btn {
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      width: 36px; height: 36px;
      background: none;
      border: 1px solid #333;
      border-radius: 8px;
      color: #888;
      cursor: pointer;
      transition: border-color .2s, color .2s;
    }
    .logout-btn:hover { border-color: #dc2626; color: #dc2626; }
    .agent-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  `],
})
export class AgentLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }
}
