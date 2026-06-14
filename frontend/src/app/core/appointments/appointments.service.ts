import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';
import { SpecialistStatus } from '../specialists/specialists.service';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentClient {
  id: number;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
  priority: number;
  center?: Center | null;
}

export interface AppointmentServiceOption {
  id: number;
  name: string;
  durationMinutes: number;
  price?: number | string | null;
  active: boolean;
  center?: Center | null;
  specialist?: AppointmentSpecialist | null;
}

export interface AppointmentSpecialist {
  id: number;
  name: string;
  specialty?: string | null;
  status: SpecialistStatus;
  center?: Center | null;
}

export interface Appointment {
  id: number;
  startDateTime: string;
  duration: number;
  outsideAvailability: boolean;
  status: AppointmentStatus;
  client: AppointmentClient;
  service: AppointmentServiceOption;
  center: Center;
  specialist: AppointmentSpecialist;
}

export interface AppointmentPayload {
  startDateTime: string;
  clientId: number;
  serviceId: number;
  specialistId: number;
  allowOutsideAvailability?: boolean;
  status?: AppointmentStatus;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private readonly appointmentsUrl = `${environment.apiUrl}/appointments`;
  private readonly clientsUrl = `${environment.apiUrl}/clients`;
  private readonly servicesUrl = `${environment.apiUrl}/services`;
  private readonly specialistsUrl = `${environment.apiUrl}/specialists`;

  constructor(private readonly http: HttpClient) {}

  getAppointments(centerId?: number | null): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.appointmentsUrl, {
      params: this.getCenterParams(centerId),
    });
  }

  createAppointment(payload: AppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(this.appointmentsUrl, payload);
  }

  updateAppointment(
    id: number,
    payload: AppointmentPayload,
  ): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.appointmentsUrl}/${id}`, payload);
  }

  deleteAppointment(id: number): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.appointmentsUrl}/${id}`);
  }

  getClients(centerId?: number | null): Observable<AppointmentClient[]> {
    return this.http.get<AppointmentClient[]>(this.clientsUrl, {
      params: this.getCenterParams(centerId),
    });
  }

  getServices(centerId?: number | null): Observable<AppointmentServiceOption[]> {
    return this.http.get<AppointmentServiceOption[]>(this.servicesUrl, {
      params: this.getCenterParams(centerId),
    });
  }

  getSpecialists(centerId?: number | null): Observable<AppointmentSpecialist[]> {
    return this.http.get<AppointmentSpecialist[]>(this.specialistsUrl, {
      params: this.getCenterParams(centerId),
    });
  }

  private getCenterParams(centerId?: number | null): HttpParams {
    return centerId ? new HttpParams().set('centerId', centerId) : new HttpParams();
  }
}
