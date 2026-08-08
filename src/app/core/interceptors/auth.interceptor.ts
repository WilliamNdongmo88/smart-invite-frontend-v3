import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const PUBLIC_URLS = [
  '/api/auth/',
  '/api/invitations/',
  '/api/link/join/',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isPublic = PUBLIC_URLS.some((url) => req.url.includes(url));
  if (isPublic) return next(req);

  const token = authService.getAccessToken();
  if (!token) return next(req);

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  );
};
