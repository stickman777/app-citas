import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';

export interface LinkedClientUser {
  id: number;
  email: string;
  name?: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  active: boolean;
  notes?: string | null;
  priority: number;
  user?: LinkedClientUser | null;
  center?: Center | null;
}

export interface ClientPayload {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  priority?: number;
  centerId?: number | null;
}

export interface ClientInvitation {
  token: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private readonly apiUrl = `${environment.apiUrl}/clients`;

  constructor(private readonly http: HttpClient) {}

  getClients(centerId?: number | null): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/all`, {
      params: this.getCenterParams(centerId),
    });
  }

  createClient(payload: ClientPayload): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, payload);
  }

  updateClient(id: number, payload: ClientPayload): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}`, payload);
  }

  createClientInvitation(id: number): Observable<ClientInvitation> {
    return this.http.post<ClientInvitation>(`${this.apiUrl}/${id}/invitation`, {});
  }

  activateClient(id: number): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateClient(id: number): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  private getCenterParams(centerId?: number | null): HttpParams {
    return centerId ? new HttpParams().set('centerId', centerId) : new HttpParams();
  }
}
