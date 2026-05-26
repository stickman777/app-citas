import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Service {
  id: number;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: number | string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePayload {
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private readonly http: HttpClient) {}

  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiUrl);
  }

  getAllServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/all`);
  }

  createService(payload: ServicePayload): Observable<Service> {
    return this.http.post<Service>(this.apiUrl, payload);
  }

  updateService(id: number, payload: ServicePayload): Observable<Service> {
    return this.http.patch<Service>(`${this.apiUrl}/${id}`, payload);
  }

  activateService(id: number): Observable<Service> {
    return this.http.patch<Service>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateService(id: number): Observable<Service> {
    return this.http.patch<Service>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
