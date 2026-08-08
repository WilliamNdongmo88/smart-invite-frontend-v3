import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="agent-layout">
      <header class="agent-header">
        <span class="logo">✉️ Smart Invite — Check-in</span>
        <button class="logout-btn" (click)="logout()">Déconnexion</button>
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
    }
    .logo { color: #c9a84c; font-weight: 700; }
    .logout-btn { background: none; border: 1px solid #333; border-radius: .375rem; color: #888; padding: .375rem .875rem; cursor: pointer; font-size: .875rem; }
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
