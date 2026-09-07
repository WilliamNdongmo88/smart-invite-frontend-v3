import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'invitations/:token/rsvp',  renderMode: RenderMode.Client },
  { path: 'join/:token',              renderMode: RenderMode.Client },
  { path: 'events/:id',               renderMode: RenderMode.Client },
  { path: 'events/:id/edit',          renderMode: RenderMode.Client },
  { path: 'events/:id/card',          renderMode: RenderMode.Client },
  { path: 'events/:id/guests',        renderMode: RenderMode.Client },
  { path: 'events/:id/invitations',   renderMode: RenderMode.Client },
  { path: 'events/:id/links',         renderMode: RenderMode.Client },
  { path: 'reset-password',           renderMode: RenderMode.Client },
  { path: 'admin/users',              renderMode: RenderMode.Client },
  { path: 'admin/payments',           renderMode: RenderMode.Client },
  { path: 'checkin/scan',             renderMode: RenderMode.Client },
  { path: '**',                       renderMode: RenderMode.Client },
];
