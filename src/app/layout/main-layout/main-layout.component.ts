import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  template: `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <span class="logo">✉️ Smart Invite</span>
        </div>

        <nav class="sidebar-nav">
          @if (role() === 'USER') {
            <a routerLink="/dashboard"   routerLinkActive="active" class="nav-item">🏠 Dashboard</a>
            <a routerLink="/events"      routerLinkActive="active" class="nav-item">📅 Événements</a>
            <a routerLink="/payments"    routerLinkActive="active" class="nav-item">💳 Paiements</a>
          }
          @if (role() === 'ADMIN') {
            <a routerLink="/admin/users"    routerLinkActive="active" class="nav-item">👥 Utilisateurs</a>
            <a routerLink="/admin/payments" routerLinkActive="active" class="nav-item">💳 Paiements</a>
          }
          <a routerLink="/profile" routerLinkActive="active" class="nav-item">👤 Profil</a>
        </nav>

        <button class="logout-btn" (click)="logout()">🚪 Déconnexion</button>
      </aside>

      <!-- Main content -->
      <div class="main-content">
        <header class="topbar">
          <button class="toggle-btn" (click)="toggleSidebar()" aria-label="Toggle sidebar">☰</button>
          <div class="topbar-right">
            <app-avatar [name]="''" [size]="34" />
          </div>
        </header>
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; background: #111; }
    .sidebar {
      width: 220px; background: #1a1a1a; border-right: 1px solid #2a2a2a;
      display: flex; flex-direction: column; transition: width .2s;
      flex-shrink: 0;
    }
    .sidebar.collapsed { width: 0; overflow: hidden; }
    .sidebar-header { padding: 1.25rem 1rem; border-bottom: 1px solid #2a2a2a; }
    .logo { color: #c9a84c; font-weight: 700; font-size: 1rem; white-space: nowrap; }
    .sidebar-nav { flex: 1; display: flex; flex-direction: column; padding: .75rem 0; gap: .25rem; }
    .nav-item {
      display: flex; align-items: center; gap: .625rem;
      padding: .625rem 1rem; color: #aaa; text-decoration: none;
      font-size: .875rem; border-radius: .375rem; margin: 0 .5rem;
      white-space: nowrap;
    }
    .nav-item:hover { background: #2a2a2a; color: #fff; }
    .nav-item.active { background: #2a2a2a; color: #c9a84c; font-weight: 600; }
    .logout-btn {
      margin: .75rem; padding: .625rem 1rem; background: transparent;
      border: 1px solid #333; border-radius: .375rem; color: #888;
      cursor: pointer; font-size: .875rem; text-align: left;
    }
    .logout-btn:hover { border-color: #dc2626; color: #dc2626; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar {
      height: 56px; background: #1a1a1a; border-bottom: 1px solid #2a2a2a;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.25rem; flex-shrink: 0;
    }
    .toggle-btn { background: none; border: none; color: #aaa; cursor: pointer; font-size: 1.25rem; }
    .topbar-right { display: flex; align-items: center; gap: .75rem; }
    .page-content { flex: 1; overflow-y: auto; padding: 1.5rem; }
  `],
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly sidebarCollapsed = signal(false);
  readonly role = signal(this.auth.getRole());

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }
}
