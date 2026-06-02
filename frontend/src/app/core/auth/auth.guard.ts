import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { routes } from '../../shared/routes/routes';
import { AuthService, CurrentUser } from './auth.service';

const checkAuth = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? true : router.createUrlTree([routes.login]);
};

export const authGuard: CanActivateFn = () => checkAuth();

export const authChildGuard: CanActivateChildFn = () => checkAuth();

const checkRole = (
  allowedRoles: CurrentUser['role'][],
  fallbackRoute: string,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree([routes.login]);
  }

  return authService.loadCurrentUser().pipe(
    map(user =>
      allowedRoles.includes(user.role)
        ? true
        : router.createUrlTree([fallbackRoute])
    ),
    catchError(() => of(router.createUrlTree([routes.login])))
  );
};

const checkAdminArea = () =>
  checkRole(['ADMIN', 'GESTOR'], routes.clientHome);

const checkClientArea = () =>
  checkRole(['CLIENT'], routes.index);

export const adminAreaGuard: CanActivateFn = () => checkAdminArea();

export const adminAreaChildGuard: CanActivateChildFn = () => checkAdminArea();

export const clientAreaGuard: CanActivateFn = () => checkClientArea();

export const clientAreaChildGuard: CanActivateChildFn = () => checkClientArea();
