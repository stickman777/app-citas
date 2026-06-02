import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  finalize,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { routes } from '../../shared/routes/routes';
import { ActiveCenterService } from '../centers/active-center.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface CurrentUserCenter {
  id: number;
  name: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'GESTOR' | 'CLIENT';
  activeCenterId: number | null;
  activeCenter?: CurrentUserCenter | null;
  centerIds: number[];
  centers?: CurrentUserCenter[];
}

export interface UpdateCurrentUserPayload {
  name?: string;
  email?: string;
  currentPassword?: string;
  password?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    null
  );
  private currentUserRequest$?: Observable<CurrentUser>;

  public readonly currentUser$ = this.currentUserSubject.asObservable();

  public get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly activeCenterService: ActiveCenterService
  ) {}

  login(credentials: LoginCredentials): Observable<CurrentUser> {
    this.clearSession();

    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response =>
          localStorage.setItem(this.tokenKey, response.access_token)
        ),
        switchMap(() => this.loadCurrentUser(true))
      );
  }

  getCurrentUser(): Observable<CurrentUser> {
    return this.loadCurrentUser();
  }

  updateCurrentUser(payload: UpdateCurrentUserPayload): Observable<CurrentUser> {
    return this.http
      .patch<CurrentUser>(`${environment.apiUrl}/auth/me`, payload)
      .pipe(tap(user => this.setCurrentUser(user)));
  }

  loadCurrentUser(forceRefresh = false): Observable<CurrentUser> {
    if (!this.isAuthenticated()) {
      this.currentUserSubject.next(null);

      return throwError(() => new Error('Usuario no autenticado'));
    }

    if (!forceRefresh && this.currentUser) {
      return of(this.currentUser);
    }

    if (!forceRefresh && this.currentUserRequest$) {
      return this.currentUserRequest$;
    }

    this.currentUserRequest$ = this.fetchCurrentUser().pipe(
      finalize(() => {
        this.currentUserRequest$ = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.currentUserRequest$;
  }

  private fetchCurrentUser(): Observable<CurrentUser> {
    return this.http
      .get<CurrentUser>(`${environment.apiUrl}/auth/me`)
      .pipe(tap(user => this.setCurrentUser(user)));
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate([routes.login]);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) return false;

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };

      return !payload.exp || payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  private setCurrentUser(user: CurrentUser): void {
    this.currentUserSubject.next(user);
    this.activeCenterService.setUserContext(user.id, user.activeCenterId);
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    this.activeCenterService.clearUserContext();
    this.currentUserSubject.next(null);
  }
}
