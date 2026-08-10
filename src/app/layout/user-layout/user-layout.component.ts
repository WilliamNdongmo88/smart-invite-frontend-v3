import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent],
  template: `
    <div class="user-layout">
      <app-topbar [userName]="userName" />

      <!-- Bottom nav mobile -->
      <nav class="bottom-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </a>
        <a routerLink="/events" routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Événements</span>
        </a>
        <a routerLink="/payments" routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <span>Paiements</span>
        </a>
        <a routerLink="/profile" routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Profil</span>
        </a>
      </nav>

      <main class="user-content">
        <router-outlet />
      </main>

      <footer class="user-footer">
        <span>© {{ year }} SmartInvite</span>
      </footer>
    </div>
  `,
  styles: [`
    .user-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #111;
    }

    /* ── Content ── */
    .user-content {
      flex: 1;
      padding: 1.5rem;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
      padding-bottom: 5rem; /* espace pour bottom nav mobile */
    }

    /* ── Footer ── */
    .user-footer {
      text-align: center;
      padding: 1rem;
      font-size: 0.75rem;
      color: #555;
      border-top: 1px solid #2a2a2a;
    }

    /* ── Bottom nav (mobile) ── */
    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: #1a1a1a;
      border-top: 1px solid #2a2a2a;
      z-index: 200;
    }

    .bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      color: #666;
      text-decoration: none;
      font-size: 0.65rem;
      font-weight: 500;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      transition: color 0.2s;
      flex: 1;
      justify-content: center;
    }
    .nav-item:hover { color: #aaa; }
    .nav-item.active { color: #c9a84c; }

    /* Desktop : cacher bottom nav, ajouter nav horizontale dans topbar */
    @media (min-width: 769px) {
      .bottom-nav { display: none !important; }
      .user-content { padding-bottom: 1.5rem; }
    }

    @media (max-width: 768px) {
      .user-content { padding: 1rem; }
    }
  `],
})
export class UserLayoutComponent {
  private readonly auth = inject(AuthService);
  readonly userName = this.auth.getRole() ?? '';
  readonly year = new Date().getFullYear();
}
