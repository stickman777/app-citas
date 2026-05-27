import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';

export interface LinkedClientUser {
  id: number;
  email: string;
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

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private readonly apiUrl = `${environment.apiUrl}/clients`;

  constructor(private readonly http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/all`);
  }

  createClient(payload: ClientPayload): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, payload);
  }

  updateClient(id: number, payload: ClientPayload): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}`, payload);
  }

  activateClient(id: number): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateClient(id: number): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
