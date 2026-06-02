import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AppointmentStatus } from '../appointments/appointments.service';

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

@Injectable({
  providedIn: 'root',
})
export class ClientPortalService {
  private readonly apiUrl = `${environment.apiUrl}/client-portal`;

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<ClientPortalProfile> {
    return this.http.get<ClientPortalProfile>(`${this.apiUrl}/me`);
  }

  getAppointments(): Observable<ClientPortalAppointment[]> {
    return this.http.get<ClientPortalAppointment[]>(
      `${this.apiUrl}/appointments`,
    );
  }
}
