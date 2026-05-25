import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { routes } from '../../shared/routes/routes';
import { AuthService } from './auth.service';

const checkAuth = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? true : router.createUrlTree([routes.login]);
};

export const authGuard: CanActivateFn = () => checkAuth();

export const authChildGuard: CanActivateChildFn = () => checkAuth();
