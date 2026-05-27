import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';

export interface Availability {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  center?: Center | null;
}

export interface AvailabilityPayload {
  centerId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  private readonly apiUrl = `${environment.apiUrl}/availability`;

  constructor(private readonly http: HttpClient) {}

  getAvailability(centerId?: number | null): Observable<Availability[]> {
    return this.http.get<Availability[]>(this.apiUrl, {
      params: this.getCenterParams(centerId),
    });
  }

  createAvailability(payload: AvailabilityPayload): Observable<Availability> {
    return this.http.post<Availability>(this.apiUrl, payload);
  }

  updateAvailability(
    id: number,
    payload: AvailabilityPayload,
  ): Observable<Availability> {
    return this.http.patch<Availability>(`${this.apiUrl}/${id}`, payload);
  }

  deleteAvailability(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  private getCenterParams(centerId?: number | null): HttpParams {
    return centerId
      ? new HttpParams().set('centerId', centerId)
      : new HttpParams();
  }
}
