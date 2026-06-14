import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';

export type SpecialistStatus = 'ACTIVE' | 'INACTIVE';

export interface Specialist {
  id: number;
  name: string;
  specialty?: string | null;
  status: SpecialistStatus;
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

export interface SpecialistAbsence {
  id: number;
  startDate: string;
  endDate: string;
  reason?: string | null;
  createdAt: string;
}

export interface SpecialistAbsencePayload {
  startDate: string;
  endDate: string;
  reason?: string | null;
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

  listAbsences(specialistId: number): Observable<SpecialistAbsence[]> {
    return this.http.get<SpecialistAbsence[]>(
      `${this.apiUrl}/${specialistId}/absences`,
    );
  }

  createAbsence(
    specialistId: number,
    payload: SpecialistAbsencePayload,
  ): Observable<SpecialistAbsence> {
    return this.http.post<SpecialistAbsence>(
      `${this.apiUrl}/${specialistId}/absences`,
      payload,
    );
  }

  removeAbsence(absenceId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/absences/${absenceId}`,
    );
  }

  private getCenterParams(centerId?: number | null): HttpParams {
    return centerId
      ? new HttpParams().set('centerId', centerId)
      : new HttpParams();
  }
}
