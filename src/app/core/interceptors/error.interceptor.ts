import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  filter,
  finalize,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * ── État partagé entre toutes les requêtes interceptées ──
 *
 * isRefreshing : true pendant qu'un appel /refresh est en cours
 * refreshDone$ : émet le nouveau access token quand le refresh est terminé
 *               (null = en attente, string = token prêt)
 *
 * Ces variables sont au niveau module (hors de la fonction intercepteur)
 * pour être partagées entre tous les appels concurrents.
 */
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {

      // ── 401 Unauthorized ──
      if (error.status === HttpStatusCode.Unauthorized) {

        // Ne pas intercepter les appels auth (évite la boucle infinie)
        if (req.url.includes('/api/auth/')) {
          return throwError(() => error);
        }

        // Pas de refresh token → déconnecter immédiatement
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          authService.clearTokens();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        // ── Cas 1 : Un refresh est DÉJÀ en cours ──
        // On attend que le refresh en cours se termine, puis on rejoue la requête
        if (isRefreshing) {
          return refreshDone$.pipe(
            // Ignorer les valeurs null (état "en attente")
            filter((token): token is string => token !== null),
            take(1),
            switchMap((newToken) =>
              next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
            )
          );
        }

        // ── Cas 2 : Aucun refresh en cours → on le lance ──
        isRefreshing = true;
        refreshDone$.next(null); // signaler "refresh en cours"

        return authService.refresh().pipe(
          switchMap((res) => {
            const newToken = res.data!.accessToken;
            refreshDone$.next(newToken); // débloquer les requêtes en attente
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
          }),
          catchError((refreshError) => {
            // Le refresh lui-même a échoué (token vraiment expiré/invalide)
            // → déconnecter seulement si le serveur dit explicitement 401/403
            if (
              refreshError.status === HttpStatusCode.Unauthorized ||
              refreshError.status === HttpStatusCode.Forbidden
            ) {
              authService.clearTokens();
              router.navigate(['/login']);
            }
            return throwError(() => refreshError);
          }),
          finalize(() => {
            // Toujours réinitialiser le verrou quand le refresh est terminé
            isRefreshing = false;
          })
        );
      }

      // ── 403 Forbidden (hors refresh) ──
      if (error.status === HttpStatusCode.Forbidden) {
        const msg = error?.error?.message;
        if (msg) toast.error(msg);
        else toast.error('Accès refusé');
      }

      // ── 5xx Erreur serveur ──
      if (error.status >= 500) {
        toast.error('Erreur serveur, veuillez réessayer');
      }

      return throwError(() => error);
    })
  );
};
