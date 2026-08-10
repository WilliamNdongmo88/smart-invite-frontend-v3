import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent],
  template: `
    <div class="admin-layout">
      <app-topbar [showMenuBtn]="true" [userName]="userName()" (menuClick)="toggleSidebar()" />

      <div class="admin-body">
        <!-- Sidebar -->
        <aside class="sidebar" [class.collapsed]="sidebarCollapsed()" [class.open]="mobileOpen()">
          <div class="sidebar-header">
            <span class="sidebar-title">Administration</span>
          </div>
          <nav class="sidebar-nav">
            <a routerLink="/admin/users" routerLinkActive="active" class="nav-item" (click)="closeMobile()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Utilisateurs</span>
            </a>
            <a routerLink="/admin/payments" routerLinkActive="active" class="nav-item" (click)="closeMobile()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span>Paiements</span>
            </a>
            <a routerLink="/profile" routerLinkActive="active" class="nav-item" (click)="closeMobile()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Profil</span>
            </a>
          </nav>
        </aside>

        <!-- Overlay mobile -->
        @if (mobileOpen()) {
          <div class="sidebar-overlay" (click)="closeMobile()"></div>
        }

        <!-- Main -->
        <div class="admin-main">
          <main class="admin-content">
            <router-outlet />
          </main>
          <footer class="admin-footer">
            <span>© {{ year }} SmartInvite — Administration</span>
          </footer>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; flex-direction: column; min-height: 100vh; background: #111; }
    .admin-body { display: flex; flex: 1; overflow: hidden; }

    .sidebar {
      width: 220px; background: #1a1a1a; border-right: 1px solid #2a2a2a;
      display: flex; flex-direction: column; flex-shrink: 0;
      transition: width 0.2s; overflow: hidden;
    }
    .sidebar.collapsed { width: 0; }

    .sidebar-header { padding: 1rem 1.25rem; border-bottom: 1px solid #2a2a2a; white-space: nowrap; }
    .sidebar-title { color: #c9a84c; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }

    .sidebar-nav { flex: 1; display: flex; flex-direction: column; padding: 0.75rem 0; gap: 0.25rem; }

    .nav-item {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 0.625rem 1rem; color: #aaa; text-decoration: none;
      font-size: 0.875rem; border-radius: 0.375rem; margin: 0 0.5rem;
      white-space: nowrap; transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover { background: #2a2a2a; color: #fff; }
    .nav-item.active { background: #2a2a2a; color: #c9a84c; font-weight: 600; }

    .admin-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .admin-content { flex: 1; overflow-y: auto; padding: 1.5rem; }
    .admin-footer {
      text-align: center; padding: 0.875rem; font-size: 0.75rem;
      color: #555; border-top: 1px solid #2a2a2a; flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed; top: 56px; left: 0; bottom: 0;
        width: 240px; z-index: 300;
        transform: translateX(-100%); transition: transform 0.25s ease;
      }
      .sidebar.open { transform: translateX(0); }
      .sidebar.collapsed { width: 240px; transform: translateX(-100%); }
      .sidebar-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 299;
      }
      .admin-content { padding: 1rem; }
    }
  `],
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);

  sidebarCollapsed = signal(false);
  mobileOpen = signal(false);
  readonly year = new Date().getFullYear();
  readonly userName = signal(this.auth.getName() ?? 'Admin');

  toggleSidebar(): void {
    if (window.innerWidth <= 768) {
      this.mobileOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
    }
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
