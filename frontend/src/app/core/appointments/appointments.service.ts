import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentClient {
  id: number;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
}

export interface AppointmentServiceOption {
  id: number;
  name: string;
  durationMinutes: number;
  price?: number | string | null;
  active: boolean;
}

export interface Appointment {
  id: number;
  startDateTime: string;
  duration: number;
  status: AppointmentStatus;
  client: AppointmentClient;
  service: AppointmentServiceOption;
}

export interface AppointmentPayload {
  startDateTime: string;
  clientId: number;
  serviceId: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private readonly appointmentsUrl = `${environment.apiUrl}/appointments`;
  private readonly clientsUrl = `${environment.apiUrl}/clients`;
  private readonly servicesUrl = `${environment.apiUrl}/services`;

  constructor(private readonly http: HttpClient) {}

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.appointmentsUrl);
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

  getClients(): Observable<AppointmentClient[]> {
    return this.http.get<AppointmentClient[]>(this.clientsUrl);
  }

  getServices(): Observable<AppointmentServiceOption[]> {
    return this.http.get<AppointmentServiceOption[]>(this.servicesUrl);
  }
}
