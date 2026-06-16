import { Injectable } from '@angular/core';

import {
  ClientPortalAppointment,
  ClientPortalAppointmentRequest,
} from './client-portal.service';

export interface ClientPortalAppointmentsCache {
  appointments: ClientPortalAppointment[];
  requests: ClientPortalAppointmentRequest[];
  savedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientPortalOfflineCacheService {
  private readonly appointmentsKeyPrefix =
    'client_portal_appointments_cache';

  getAppointments(userId: number): ClientPortalAppointmentsCache | null {
    const rawValue = localStorage.getItem(this.getAppointmentsKey(userId));

    if (!rawValue) return null;

    try {
      const parsedValue = JSON.parse(rawValue) as ClientPortalAppointmentsCache;

      if (
        !Array.isArray(parsedValue.appointments) ||
        !Array.isArray(parsedValue.requests) ||
        typeof parsedValue.savedAt !== 'string'
      ) {
        return null;
      }

      return parsedValue;
    } catch {
      return null;
    }
  }

  saveAppointments(
    userId: number,
    appointments: ClientPortalAppointment[],
    requests: ClientPortalAppointmentRequest[],
  ): void {
    const cache: ClientPortalAppointmentsCache = {
      appointments,
      requests,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      this.getAppointmentsKey(userId),
      JSON.stringify(cache),
    );
  }

  private getAppointmentsKey(userId: number): string {
    return `${this.appointmentsKeyPrefix}_${userId}`;
  }
}
