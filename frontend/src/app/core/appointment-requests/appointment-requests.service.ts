import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type AppointmentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AppointmentRequestAction = 'APPROVE' | 'REJECT';

export interface AppointmentRequest {
  id: number;
  requestedStartDateTime: string;
  outsideAvailability: boolean;
  notes: string | null;
  status: AppointmentRequestStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  appointmentId: number | null;
  client: {
    id: number;
    name: string;
    phone: string;
    priority: number;
  };
  service: {
    id: number;
    name: string;
    durationMinutes: number;
  };
  specialist: {
    id: number;
    name: string;
    specialty: string | null;
  };
  center: {
    id: number;
    name: string;
  };
}

export interface ResolveAppointmentRequestPayload {
  action: AppointmentRequestAction;
  resolutionNote?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentRequestsService {
  private readonly apiUrl = `${environment.apiUrl}/appointment-requests`;

  constructor(private readonly http: HttpClient) {}

  getPending(centerId?: number | null): Observable<AppointmentRequest[]> {
    const params = centerId
      ? new HttpParams().set('centerId', centerId)
      : new HttpParams();

    return this.http.get<AppointmentRequest[]>(this.apiUrl, { params });
  }

  resolve(
    id: number,
    payload: ResolveAppointmentRequestPayload,
  ): Observable<AppointmentRequest> {
    return this.http.patch<AppointmentRequest>(
      `${this.apiUrl}/${id}/resolve`,
      payload,
    );
  }
}
