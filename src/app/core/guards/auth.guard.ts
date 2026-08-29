import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // ?preview=true      → organisateur depuis le bouton "Carte" (connecté mais on laisse passer)
  // ?preview_details=true → invité via lien mail (non connecté — accès public)
  const isPreview =
    route.queryParamMap.get('preview') === 'true' ||
    route.queryParamMap.get('preview_details') === 'true' ||
    state.url.includes('preview=true') ||
    state.url.includes('preview_details=true');

  if (isPreview) return true;

  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
