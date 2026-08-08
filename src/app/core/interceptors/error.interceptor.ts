import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === HttpStatusCode.Unauthorized) {
        // Éviter la boucle infinie sur les endpoints auth
        if (req.url.includes('/api/auth/')) {
          return throwError(() => error);
        }
        // Tenter le refresh
        return authService.refresh().pipe(
          switchMap(() => {
            const token = authService.getAccessToken();
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
          }),
          catchError((refreshError) => {
            authService.clearTokens();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      if (error.status === HttpStatusCode.Forbidden) {
        toast.error('Accès refusé');
      }

      if (error.status >= 500) {
        toast.error('Erreur serveur, veuillez réessayer');
      }

      return throwError(() => error);
    })
  );
};
