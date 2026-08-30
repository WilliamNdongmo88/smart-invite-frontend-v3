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

      <div class="layout-body">
        <!-- Sidebar desktop/tablette -->
        <nav class="sidebar">
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
      </div>

      <!-- Bottom nav mobile uniquement -->
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

    /* ── Layout body : sidebar + content ── */
    .layout-body {
      display: flex;
      flex: 1;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    /* ── Sidebar desktop/tablette ── */
    .sidebar {
      display: none; /* caché sur mobile, affiché via media query */
      flex-direction: column;
      width: 200px;
      flex-shrink: 0;
      background: #1a1a1a;
      border-right: 1px solid #2a2a2a;
      padding: 1.5rem 0.75rem;
      gap: 0.25rem;
      position: sticky;
      top: 0;
      height: calc(100vh - 56px); /* hauteur topbar ~56px */
      overflow-y: auto;
    }

    /* ── Content ── */
    .user-content {
      flex: 1;
      min-width: 0;
      padding: 1.5rem;
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

    /* ── Nav items (partagé sidebar + bottom nav) ── */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: #666;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      transition: color 0.2s, background 0.2s;
      white-space: nowrap;
    }
    .nav-item:hover { color: #aaa; background: #222; }
    .nav-item.active { color: #c9a84c; background: rgba(201,168,76,0.1); }

    /* ── Bottom nav mobile ── */
    .bottom-nav {
      display: none; /* caché par défaut — affiché sur mobile */
    }

    /* ══ DESKTOP & TABLETTE (≥769px) ══ */
    @media (min-width: 769px) {
      .sidebar { display: flex; }
      .bottom-nav { display: none; }
      .user-footer { display: block; }
      .user-content { padding: 2rem 1.5rem; }
    }

    /* ══ MOBILE (≤768px) ══ */
    @media (max-width: 768px) {
      .layout-body { flex-direction: column; }
      .sidebar { display: none; }
      .user-footer { display: none; }

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
        padding-bottom: env(safe-area-inset-bottom, 0);
      }

      .bottom-nav .nav-item {
        flex-direction: column;
        justify-content: center;
        gap: 0.2rem;
        font-size: 0.65rem;
        padding: 0.4rem 0.5rem;
        flex: 1;
        min-width: 0;
      }
      .bottom-nav .nav-item span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .user-content {
        padding: 1rem 1rem calc(60px + 1rem + env(safe-area-inset-bottom, 0px));
      }
    }

    @media (max-width: 480px) {
      .user-content { padding: 0.75rem 0.75rem calc(60px + 0.75rem + env(safe-area-inset-bottom, 0px)); }
    }

    @media (max-width: 360px) {
      .user-content { padding: 0.5rem 0.5rem calc(60px + 0.5rem + env(safe-area-inset-bottom, 0px)); }
      .bottom-nav .nav-item { font-size: 0.6rem; }
    }
  `],
})
export class UserLayoutComponent {
  private readonly auth = inject(AuthService);
  readonly userName = this.auth.getName() ?? '';
  readonly year = new Date().getFullYear();
}
