import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Center {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CenterPayload {
  name: string;
  city?: string | null;
  logoUrl?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CentersService {
  private readonly apiUrl = `${environment.apiUrl}/centers`;
  private readonly centersChangedSubject = new Subject<void>();

  public readonly centersChanged$ = this.centersChangedSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getCenters(): Observable<Center[]> {
    return this.http.get<Center[]>(this.apiUrl);
  }

  getAllCenters(): Observable<Center[]> {
    return this.http.get<Center[]>(`${this.apiUrl}/all`);
  }

  createCenter(payload: CenterPayload): Observable<Center> {
    return this.http
      .post<Center>(this.apiUrl, payload)
      .pipe(tap(() => this.centersChangedSubject.next()));
  }

  updateCenter(id: number, payload: CenterPayload): Observable<Center> {
    return this.http
      .patch<Center>(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.centersChangedSubject.next()));
  }

  activateCenter(id: number): Observable<Center> {
    return this.http
      .patch<Center>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(tap(() => this.centersChangedSubject.next()));
  }

  deactivateCenter(id: number): Observable<Center> {
    return this.http
      .patch<Center>(`${this.apiUrl}/${id}/deactivate`, {})
      .pipe(tap(() => this.centersChangedSubject.next()));
  }
}
