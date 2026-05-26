import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';

export interface Service {
  id: number;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: number | string | null;
  active: boolean;
  center?: Center | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePayload {
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: number | null;
  centerId?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private readonly http: HttpClient) {}

  getServices(centerId?: number | null): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiUrl, {
      params: this.getCenterParams(centerId),
    });
  }

  getAllServices(centerId?: number | null): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/all`, {
      params: this.getCenterParams(centerId),
    });
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

  private getCenterParams(centerId?: number | null): HttpParams {
    return centerId ? new HttpParams().set('centerId', centerId) : new HttpParams();
  }
}
