import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AppointmentStatus } from '../appointments/appointments.service';

export type ClientPortalAppointmentRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface ClientPortalCenter {
  id: number;
  name: string;
  city?: string | null;
  logoUrl?: string | null;
}

export interface ClientPortalProfile {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  center?: ClientPortalCenter | null;
}

export interface ClientPortalAppointment {
  id: number;
  startDateTime: string;
  duration: number;
  status: AppointmentStatus;
  center: ClientPortalCenter;
  service: {
    id: number;
    name: string;
    durationMinutes: number;
    price?: number | string | null;
  };
  specialist: {
    id: number;
    name: string;
    specialty?: string | null;
  };
}

export interface ClientPortalAppointmentRequest {
  id: number;
  requestedStartDateTime: string;
  outsideAvailability: boolean;
  notes: string | null;
  status: ClientPortalAppointmentRequestStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  appointmentId: number | null;
  service: {
    id: number;
    name: string;
    durationMinutes: number;
  };
  specialist: {
    id: number;
    name: string;
    specialty?: string | null;
  };
  center: ClientPortalCenter;
}

export interface ClientPortalSpecialist {
  id: number;
  name: string;
  specialty?: string | null;
}

export interface ClientPortalServiceOption {
  id: number;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: number | string | null;
  specialist?: ClientPortalSpecialist | null;
}

export interface ClientPortalAppointmentPayload {
  startDateTime: string;
  serviceId: number;
  specialistId: number;
}

export interface ClientPortalAppointmentRequestPayload {
  startDateTime: string;
  serviceId: number;
  specialistId: number;
  notes?: string;
}

export interface UpdateClientPortalProfilePayload {
  name: string;
  phone: string;
  email?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ClientPortalService {
  private readonly apiUrl = `${environment.apiUrl}/client-portal`;

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<ClientPortalProfile> {
    return this.http.get<ClientPortalProfile>(`${this.apiUrl}/me`);
  }

  updateProfile(
    payload: UpdateClientPortalProfilePayload,
  ): Observable<ClientPortalProfile> {
    return this.http.patch<ClientPortalProfile>(`${this.apiUrl}/me`, payload);
  }

  getAppointments(): Observable<ClientPortalAppointment[]> {
    return this.http.get<ClientPortalAppointment[]>(
      `${this.apiUrl}/appointments`,
    );
  }

  getAppointmentRequests(): Observable<ClientPortalAppointmentRequest[]> {
    return this.http.get<ClientPortalAppointmentRequest[]>(
      `${this.apiUrl}/appointment-requests`,
    );
  }

  getServices(): Observable<ClientPortalServiceOption[]> {
    return this.http.get<ClientPortalServiceOption[]>(`${this.apiUrl}/services`);
  }

  getSpecialists(serviceId?: number | null): Observable<ClientPortalSpecialist[]> {
    const params = serviceId
      ? new HttpParams().set('serviceId', serviceId)
      : new HttpParams();

    return this.http.get<ClientPortalSpecialist[]>(
      `${this.apiUrl}/specialists`,
      { params },
    );
  }

  getAvailableSlots(
    date: string,
    serviceId: number,
    specialistId: number,
  ): Observable<string[]> {
    const params = new HttpParams()
      .set('date', date)
      .set('serviceId', serviceId)
      .set('specialistId', specialistId);

    return this.http.get<string[]>(`${this.apiUrl}/available-slots`, {
      params,
    });
  }

  createAppointment(
    payload: ClientPortalAppointmentPayload,
  ): Observable<ClientPortalAppointment> {
    return this.http.post<ClientPortalAppointment>(
      `${this.apiUrl}/appointments`,
      payload,
    );
  }

  createAppointmentRequest(
    payload: ClientPortalAppointmentRequestPayload,
  ): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/appointment-requests`, payload);
  }
}
