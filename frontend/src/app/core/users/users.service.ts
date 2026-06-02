import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from '../centers/centers.service';

export type UserRole = 'ADMIN' | 'GESTOR' | 'CLIENT';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  centers?: Center[];
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  centerIds?: number[];
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  createUser(payload: CreateUserPayload): Observable<User> {
    return this.http.post<User>(this.apiUrl, payload);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, payload);
  }

  deleteUser(id: number): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/${id}`);
  }
}
