import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';

import {
  adminAreaGuard,
  authGuard,
  clientAreaGuard,
} from './auth.guard';
import { AuthService, CurrentUser } from './auth.service';

describe('auth guards - HU-01 RNF-01', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'loadCurrentUser',
      'restoreCachedCurrentUser',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: unknown[]) => ({
      commands,
    }) as never);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('HU-01 RNF-01 authGuard: redirige a login si no hay token', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toEqual({ commands: ['/login'] } as never);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('HU-01 RNF-01 authGuard: permite acceso si existe sesion autenticada', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toBeTrue();
  });

  it('HU-01 RNF-01 adminAreaGuard: permite ADMIN y GESTOR autenticados', async () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.loadCurrentUser.and.returnValue(
      of({ role: 'GESTOR' } as CurrentUser),
    );

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        adminAreaGuard({} as never, {} as never),
      ) as never,
    );

    expect(result).toBeTrue();
  });

  it('HU-01 RNF-01 adminAreaGuard: redirige al area cliente si el rol es CLIENT', async () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.loadCurrentUser.and.returnValue(
      of({ role: 'CLIENT' } as CurrentUser),
    );

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        adminAreaGuard({} as never, {} as never),
      ) as never,
    );

    expect(result).toEqual({ commands: ['/client'] } as never);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/client']);
  });

  it('HU-01 RNF-01 clientAreaGuard: redirige a index si el rol no es CLIENT', async () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.loadCurrentUser.and.returnValue(
      of({ role: 'ADMIN' } as CurrentUser),
    );

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        clientAreaGuard({} as never, {} as never),
      ) as never,
    );

    expect(result).toEqual({ commands: ['/index'] } as never);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/index']);
  });

  it('HU-01 RNF-01 clientAreaGuard: permite CLIENT restaurado de cache si falla la carga online', async () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.loadCurrentUser.and.returnValue(throwError(() => new Error()));
    authService.restoreCachedCurrentUser.and.returnValue({
      role: 'CLIENT',
    } as CurrentUser);

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        clientAreaGuard({} as never, {} as never),
      ) as never,
    );

    expect(result).toBeTrue();
  });
});
