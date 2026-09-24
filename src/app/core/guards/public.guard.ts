import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  const role = auth.getRole();
  if (role === 'AGENT') return router.createUrlTree(['/checkin/scan']);
  if (role === 'ADMIN') return router.createUrlTree(['/admin/users']);
  return router.createUrlTree(['/dashboard']);
};
