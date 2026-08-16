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
        <a routerLink="/agents" routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <span>Agents</span>
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
        <span>© {{ year }} smart-invite</span>
      </footer>
    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; }

    .user-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      background: #111;
      overflow-x: hidden;
      width: 100%;
    }

    /* ── Content ── */
    .user-content {
      flex: 1;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
      box-sizing: border-box;
      overflow-x: hidden;
    }

    /* ── Footer ── */
    .user-footer {
      text-align: center;
      padding: 1rem;
      font-size: 0.75rem;
      color: #555;
      border-top: 1px solid #2a2a2a;
    }

    /* ── Bottom nav ── */
    .bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      position: fixed;
      bottom: 8px;
      left: 8px;
      right: 8px;
      height: 60px;
      background: #1a1a1a;
      border-top: 1px solid #2a2a2a;
      z-index: 200;
      border-radius: 10px;
      /* safe area pour iPhone avec encoche */
      padding-bottom: env(safe-area-inset-bottom, 0);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      color: #666;
      text-decoration: none;
      font-size: 0.65rem;
      font-weight: 500;
      padding: 0.4rem 0.5rem;
      border-radius: 8px;
      transition: color 0.2s;
      flex: 1;
      min-width: 0;
    }
    .nav-item span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .nav-item:hover { color: #aaa; }
    .nav-item.active { color: #c9a84c; }

    /* Desktop : cacher bottom nav */
    @media (min-width: 769px) {
      .bottom-nav { display: none; }
      .user-content { padding: 2rem 1.5rem; }
      .user-footer { display: block; }
    }

    /* Mobile : padding-bottom pour laisser place à la bottom nav */
    @media (max-width: 768px) {
      .user-content {
        padding: 1rem 1rem calc(60px + 1rem + env(safe-area-inset-bottom, 0px));
      }
      .user-footer { display: none; }
    }

    @media (max-width: 480px) {
      .user-content { padding: 0.75rem 0.75rem calc(60px + 0.75rem + env(safe-area-inset-bottom, 0px)); }
    }

    @media (max-width: 360px) {
      .user-content { padding: 0.5rem 0.5rem calc(60px + 0.5rem + env(safe-area-inset-bottom, 0px)); }
      .nav-item { font-size: 0.6rem; }
    }
  `],
})
export class UserLayoutComponent {
  private readonly auth = inject(AuthService);
  readonly userName = this.auth.getName() ?? '';
  readonly year = new Date().getFullYear();
}
