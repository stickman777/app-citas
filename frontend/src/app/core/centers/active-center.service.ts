import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Center } from './centers.service';

const ACTIVE_CENTER_ID_KEY = 'activeCenterId';

@Injectable({
  providedIn: 'root',
})
export class ActiveCenterService {
  private readonly activeCenterSubject = new BehaviorSubject<Center | null>(null);
  private availableCenters: Center[] = [];
  private currentUserId: number | null = null;
  private preferredCenterId: number | null = null;
  private isApplyingAvailableCenters = false;

  public readonly activeCenter$ = this.activeCenterSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  public get activeCenter(): Center | null {
    return this.activeCenterSubject.value;
  }

  public setUserContext(userId: number, activeCenterId: number | null): void {
    const userChanged = this.currentUserId !== userId;

    this.currentUserId = userId;
    this.preferredCenterId = activeCenterId;

    if (userChanged) this.activeCenterSubject.next(null);
    if (this.availableCenters.length > 0)
      this.setAvailableCenters(this.availableCenters);
  }

  public clearUserContext(): void {
    this.currentUserId = null;
    this.preferredCenterId = null;
    this.availableCenters = [];
    this.activeCenterSubject.next(null);
  }

  public setAvailableCenters(centers: Center[]): void {
    this.availableCenters = centers;

    const storedCenterId = this.getStoredCenterId();
    const currentCenter = this.activeCenter;
    const center =
      centers.find(item => item.id === currentCenter?.id) ??
      centers.find(item => item.id === this.preferredCenterId) ??
      centers.find(item => item.id === storedCenterId) ??
      centers[0] ??
      null;

    this.isApplyingAvailableCenters = true;
    this.setActiveCenter(center);
    this.isApplyingAvailableCenters = false;
  }

  public setActiveCenter(center: Center | null): void {
    this.storeActiveCenter(center?.id ?? null);
    this.activeCenterSubject.next(center);

    if (!this.isApplyingAvailableCenters && center) {
      this.preferredCenterId = center.id;
      this.http
        .patch(`${environment.apiUrl}/auth/active-center`, {
          centerId: center.id,
        })
        .subscribe({ error: () => undefined });
    }
  }

  private getStorageKey(): string {
    return this.currentUserId
      ? `${ACTIVE_CENTER_ID_KEY}:${this.currentUserId}`
      : ACTIVE_CENTER_ID_KEY;
  }

  private getStoredCenterId(): number | null {
    const centerId = Number(localStorage.getItem(this.getStorageKey()));

    return Number.isInteger(centerId) && centerId > 0 ? centerId : null;
  }

  private storeActiveCenter(centerId: number | null): void {
    if (centerId) {
      localStorage.setItem(this.getStorageKey(), String(centerId));
    } else {
      localStorage.removeItem(this.getStorageKey());
    }
  }
}
