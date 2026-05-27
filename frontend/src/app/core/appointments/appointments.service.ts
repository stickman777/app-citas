import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentClient {
  id: number;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
  center?: Center | null;
}

export interface AppointmentServiceOption {
  id: number;
  name: string;
  durationMinutes: number;
  price?: number | string | null;
  active: boolean;
  center?: Center | null;
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

  private getCenterParams(centerId?: number | null): HttpParams {
    return centerId ? new HttpParams().set('centerId', centerId) : new HttpParams();
  }
}
