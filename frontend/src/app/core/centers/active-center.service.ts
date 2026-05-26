import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Center } from './centers.service';

const ACTIVE_CENTER_ID_KEY = 'activeCenterId';

@Injectable({
  providedIn: 'root',
})
export class ActiveCenterService {
  private readonly activeCenterSubject = new BehaviorSubject<Center | null>(null);

  public readonly activeCenter$ = this.activeCenterSubject.asObservable();

  public get activeCenter(): Center | null {
    return this.activeCenterSubject.value;
  }

  public setAvailableCenters(centers: Center[]): void {
    const storedCenterId = Number(localStorage.getItem(ACTIVE_CENTER_ID_KEY));
    const currentCenter = this.activeCenter;
    const center =
      centers.find(item => item.id === currentCenter?.id) ??
      centers.find(item => item.id === storedCenterId) ??
      centers[0] ??
      null;

    this.setActiveCenter(center);
  }

  public setActiveCenter(center: Center | null): void {
    if (center) {
      localStorage.setItem(ACTIVE_CENTER_ID_KEY, String(center.id));
    } else {
      localStorage.removeItem(ACTIVE_CENTER_ID_KEY);
    }

    this.activeCenterSubject.next(center);
  }
}
