import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor - HU-01 RNF-01', () => {
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getToken',
      'logout',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }],
    });
  });

  it('HU-01 RNF-01: anade Authorization cuando existe token', done => {
    authService.getToken.and.returnValue('jwt-token');
    const request = new HttpRequest('GET', '/api/private');

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, interceptedRequest => {
        expect(interceptedRequest.headers.get('Authorization')).toBe(
          'Bearer jwt-token',
        );

        return of(new HttpResponse({ status: 200 }));
      }).subscribe(() => done());
    });
  });

  it('HU-01 RNF-01: no modifica la peticion si no hay token', done => {
    authService.getToken.and.returnValue(null);
    const request = new HttpRequest('GET', '/api/public');

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, interceptedRequest => {
        expect(interceptedRequest).toBe(request);
        expect(interceptedRequest.headers.has('Authorization')).toBeFalse();

        return of(new HttpResponse({ status: 200 }));
      }).subscribe(() => done());
    });
  });

  it('HU-01 RNF-01: dispara logout cuando la respuesta es 401', done => {
    authService.getToken.and.returnValue('jwt-token');
    const request = new HttpRequest('GET', '/api/private');
    const error = new HttpErrorResponse({ status: 401 });

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, () => throwError(() => error)).subscribe({
        error: receivedError => {
          expect(receivedError).toBe(error);
          expect(authService.logout).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
