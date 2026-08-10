import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'invitations/:token/rsvp',  renderMode: RenderMode.Server },
  { path: 'join/:token',              renderMode: RenderMode.Server },
  { path: 'events/:id',               renderMode: RenderMode.Server },
  { path: 'events/:id/edit',          renderMode: RenderMode.Server },
  { path: 'events/:id/card',          renderMode: RenderMode.Server },
  { path: 'events/:id/guests',        renderMode: RenderMode.Server },
  { path: 'events/:id/invitations',   renderMode: RenderMode.Server },
  { path: 'events/:id/links',         renderMode: RenderMode.Server },
  { path: 'reset-password',           renderMode: RenderMode.Server },
  { path: 'admin/users',              renderMode: RenderMode.Server },
  { path: 'admin/payments',           renderMode: RenderMode.Server },
  { path: 'checkin/scan',             renderMode: RenderMode.Server },
  { path: '**',                       renderMode: RenderMode.Server },
];
