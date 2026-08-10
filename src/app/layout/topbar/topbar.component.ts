import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, AvatarComponent],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        @if (showMenuBtn()) {
          <button class="menu-btn" (click)="menuClick.emit()" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        }
        <a routerLink="/" class="brand">
          <span class="brand-icon">✦</span>
          <span class="brand-name">Smart<span class="gold">Invite</span></span>
        </a>
      </div>
      <div class="topbar-right">
        <button class="logout-btn" (click)="logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span class="logout-label">Déconnexion</span>
        </button>
        <app-avatar [name]="userName()" [size]="25" />
      </div>
    </header>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; }

    .topbar {
      height: 56px;
      background: #1a1a1a;
      border-bottom: 1px solid #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 100;
      width: 100%;
      overflow: hidden;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
      flex-shrink: 1;
    }
    .menu-btn {
      background: none; border: none; color: #aaa; cursor: pointer;
      display: flex; align-items: center; padding: 0.25rem;
      border-radius: 6px; flex-shrink: 0;
    }
    .menu-btn:hover { color: #fff; background: #2a2a2a; }
    .brand {
      display: flex; align-items: center; gap: 0.35rem;
      text-decoration: none; font-weight: 700; font-size: 1rem;
      color: #fff; min-width: 0; flex-shrink: 1;
    }
    .brand-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .brand-icon { color: #c9a84c; flex-shrink: 0; }
    .gold { color: #c9a84c; }
    .topbar-right {
      display: flex; align-items: center; gap: 0.75rem;
      flex-shrink: 0;
    }
    .logout-btn {
      display: flex; align-items: center; gap: 0.4rem;
      background: none; border: 1px solid #333; border-radius: 6px;
      color: #888; cursor: pointer; font-size: 0.8rem; padding: 0.35rem 0.75rem;
      transition: border-color 0.2s, color 0.2s; white-space: nowrap;
    }
    .logout-btn:hover { border-color: #dc2626; color: #dc2626; }

    @media (max-width: 480px) {
      .topbar { padding: 0 0.75rem; }
      .logout-label { display: none; }
      .logout-btn { padding: 0.35rem; }
      .topbar-right { gap: 0.5rem; }
    }

    @media (max-width: 360px) {
      .topbar { padding: 0 0.5rem; }
      .brand-name { font-size: 0.9rem; }
    }
  `],
})
export class TopbarComponent {
  showMenuBtn = input(false);
  userName = input('');
  menuClick = output<void>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }
}
