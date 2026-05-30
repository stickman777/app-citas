import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';

export type SpecialistStatus = 'ACTIVE' | 'INACTIVE' | 'VACATION';

export interface Specialist {
  id: number;
  name: string;
  specialty?: string | null;
  active: boolean;
  status?: SpecialistStatus;
  center?: Center | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialistPayload {
  name: string;
  specialty?: string | null;
  status?: SpecialistStatus;
  centerId: number;
}

@Injectable({
  providedIn: 'root',
})
export class SpecialistsService {
  private readonly apiUrl = `${environment.apiUrl}/specialists`;

  constructor(private readonly http: HttpClient) {}

  getSpecialists(centerId?: number | null): Observable<Specialist[]> {
    return this.http.get<Specialist[]>(this.apiUrl, {
      params: this.getCenterParams(centerId),
    });
  }

  getAllSpecialists(centerId?: number | null): Observable<Specialist[]> {
    return this.http.get<Specialist[]>(`${this.apiUrl}/all`, {
      params: this.getCenterParams(centerId),
    });
  }

  createSpecialist(payload: SpecialistPayload): Observable<Specialist> {
    return this.http.post<Specialist>(this.apiUrl, payload);
  }

  updateSpecialist(
    id: number,
    payload: SpecialistPayload,
  ): Observable<Specialist> {
    return this.http.patch<Specialist>(`${this.apiUrl}/${id}`, payload);
  }

  activateSpecialist(id: number): Observable<Specialist> {
    return this.http.patch<Specialist>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateSpecialist(id: number): Observable<Specialist> {
    return this.http.patch<Specialist>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  private getCenterParams(centerId?: number | null): HttpParams {
    return centerId
      ? new HttpParams().set('centerId', centerId)
      : new HttpParams();
  }
}
