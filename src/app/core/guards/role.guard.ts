import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/enums.model';

export const roleGuard = (requiredRole: UserRole): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.getRole();
    if (role === requiredRole) return true;
    // Redirection selon le rôle réel
    if (role === 'AGENT') return router.createUrlTree(['/checkin/scan']);
    if (role === 'ADMIN') return router.createUrlTree(['/admin/users']);
    return router.createUrlTree(['/dashboard']);
  };
};
