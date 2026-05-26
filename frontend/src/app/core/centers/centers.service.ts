import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Center {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CenterPayload {
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CentersService {
  private readonly apiUrl = `${environment.apiUrl}/centers`;

  constructor(private readonly http: HttpClient) {}

  getCenters(): Observable<Center[]> {
    return this.http.get<Center[]>(this.apiUrl);
  }

  getAllCenters(): Observable<Center[]> {
    return this.http.get<Center[]>(`${this.apiUrl}/all`);
  }

  createCenter(payload: CenterPayload): Observable<Center> {
    return this.http.post<Center>(this.apiUrl, payload);
  }

  updateCenter(id: number, payload: CenterPayload): Observable<Center> {
    return this.http.patch<Center>(`${this.apiUrl}/${id}`, payload);
  }

  activateCenter(id: number): Observable<Center> {
    return this.http.patch<Center>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateCenter(id: number): Observable<Center> {
    return this.http.patch<Center>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
