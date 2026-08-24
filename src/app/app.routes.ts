import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';
import { roleGuard } from './core/guards/role.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { UserLayoutComponent } from './layout/user-layout/user-layout.component';
import { AgentLayoutComponent } from './layout/agent-layout/agent-layout.component';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';

export const routes: Routes = [
  // ── Page d'accueil ───────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/wedding-details/wedding-details.component').then((m) => m.WeddingDetailsComponent),
    pathMatch: 'full',
  },

  // ── Pages publiques (sans auth) ──────────────────────────────────
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'login',
        canActivate: [publicGuard],
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [publicGuard],
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/pages/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
      },
      {
        path: 'invitations/:token/rsvp',
        loadComponent: () =>
          import('./features/invitations/pages/rsvp-public.component').then((m) => m.RsvpPublicComponent),
      },
      {
        path: 'join/:token',
        loadComponent: () =>
          import('./features/links/pages/join/join.component').then((m) => m.JoinComponent),
      },
    ],
  },

  // ── Admin (Topbar + Sidebar + Content + Footer) ───────────────────
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard('ADMIN')],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/pages/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/admin/pages/admin-payments/admin-payments.component').then((m) => m.AdminPaymentsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/pages/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },

  // ── User (Topbar + Content + Footer, sans sidebar) ────────────────
  {
    path: '',
    component: UserLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./features/events/pages/events-list/events-list.component').then((m) => m.EventsListComponent),
      },
      {
        path: 'events/new',
        loadComponent: () =>
          import('./features/events/pages/event-create/event-create.component').then((m) => m.EventCreateComponent),
      },
      {
        // Création d'un mariage → WeddingDetailsComponent en mode création
        path: 'events/wedding/new',
        loadComponent: () =>
          import('./features/wedding-details/wedding-details.component').then((m) => m.WeddingDetailsComponent),
      },
      {
        // Création d'une conférence → ConferenceDetailsComponent en mode création
        path: 'events/conference/new',
        loadComponent: () =>
          import('./features/conference-details/conference-details.component').then((m) => m.ConferenceDetailsComponent),
      },
      {
        // Création d'un gala → GalaDetailsComponent en mode création
        path: 'events/gala/new',
        loadComponent: () =>
          import('./features/gala-details/gala-details.component').then((m) => m.GalaDetailsComponent),
      },
      {
        // Création d'une cérémonie → CeremonieDetailsComponent en mode création
        path: 'events/ceremonie/new',
        loadComponent: () =>
          import('./features/ceremonie-details/ceremonie-details.component').then((m) => m.CeremonieDetailsComponent),
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./features/events/pages/event-detail/event-detail.component').then((m) => m.EventDetailComponent),
      },
      {
        path: 'events/:id/edit',
        loadComponent: () =>
          import('./features/events/pages/event-edit/event-edit.component').then((m) => m.EventEditComponent),
      },
      {
        // Édition d'un mariage → WeddingDetailsComponent en mode édition
        path: 'events/:id/wedding',
        loadComponent: () =>
          import('./features/wedding-details/wedding-details.component').then((m) => m.WeddingDetailsComponent),
      },
      {
        // Édition d'une conférence → ConferenceDetailsComponent en mode édition
        path: 'events/:id/conference',
        loadComponent: () =>
          import('./features/conference-details/conference-details.component').then((m) => m.ConferenceDetailsComponent),
      },
      {
        // Édition d'un gala → GalaDetailsComponent en mode édition
        path: 'events/:id/gala',
        loadComponent: () =>
          import('./features/gala-details/gala-details.component').then((m) => m.GalaDetailsComponent),
      },
      {
        // Édition d'une cérémonie → CeremonieDetailsComponent en mode édition
        path: 'events/:id/ceremonie',
        loadComponent: () =>
          import('./features/ceremonie-details/ceremonie-details.component').then((m) => m.CeremonieDetailsComponent),
      },
      {
        path: 'events/:id/card',
        loadComponent: () =>
          import('./features/events/pages/event-card.component').then((m) => m.EventCardComponent),
      },
      {
        path: 'events/:id/guests',
        loadComponent: () =>
          import('./features/guests/pages/guests.component').then((m) => m.GuestsComponent),
      },
      {
        path: 'events/:id/invitations',
        loadComponent: () =>
          import('./features/invitations/pages/invitations.component').then((m) => m.InvitationsComponent),
      },
      {
        path: 'events/:id/links',
        loadComponent: () =>
          import('./features/links/pages/link/link.component').then((m) => m.LinksComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/pages/payments.component').then((m) => m.PaymentsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/pages/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'agents',
        loadComponent: () =>
          import('./features/checkin/pages/agents/agents.component').then((m) => m.AgentsComponent),
      },
    ],
  },

  // ── Agent check-in ────────────────────────────────────────────────
  {
    path: 'checkin',
    component: AgentLayoutComponent,
    canActivate: [authGuard, roleGuard('AGENT')],
    children: [
      {
        path: 'scan',
        loadComponent: () =>
          import('./features/checkin/pages/scan/scan.component').then((m) => m.ScanComponent),
      },
      { path: '', redirectTo: 'scan', pathMatch: 'full' },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
