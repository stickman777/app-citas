import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  Center,
  CenterPayload,
  CenterScheduleSlot,
  CentersService,
} from '../../../../core/centers/centers.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

interface CenterForm {
  name: string;
  city: string;
  logoUrl: string;
  schedule: CenterScheduleSlot[];
}

@Component({
  selector: 'app-center-edit',
  templateUrl: './center-edit.component.html',
  styleUrls: ['./center-edit.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
})
export class CenterEditComponent {
  public readonly dayOptions = [1, 2, 3, 4, 5, 6, 0];
  public center: Center | null = null;
  public form: CenterForm = this.getEmptyForm();
  public isLoading = false;
  public isSaving = false;
  public errorMessage = '';
  public successMessage = '';

  private centerId: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly centersService: CentersService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = this.translate('centers.errors.load');
      return;
    }

    this.centerId = id;
    this.loadCenter(id);
  }

  public saveCenter(): void {
    if (!this.centerId || !this.form.name.trim() || !this.isScheduleValid()) {
      this.errorMessage = this.translate('centers.errors.form');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    this.centersService
      .updateCenter(this.centerId, this.getPayload())
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: center => {
          this.center = center;
          this.form = this.mapCenterToForm(center);
          this.successMessage = this.translate('centers.success.updated');
        },
        error: () => {
          this.errorMessage = this.translate('centers.errors.save');
        },
      });
  }

  public trackByDay(_: number, day: number): number {
    return day;
  }

  public trackByScheduleSlot(_: number, slot: CenterScheduleSlot): CenterScheduleSlot {
    return slot;
  }

  public getDaySlots(dayOfWeek: number): CenterScheduleSlot[] {
    return this.form.schedule
      .filter(slot => Number(slot.dayOfWeek) === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  public addScheduleSlot(dayOfWeek: number): void {
    this.form.schedule = [
      ...this.form.schedule,
      { dayOfWeek, startTime: '08:00', endTime: '14:00' },
    ];
  }

  public removeScheduleSlot(slotToRemove: CenterScheduleSlot): void {
    let removed = false;

    this.form.schedule = this.form.schedule.filter(
      slot => {
        if (!removed && slot === slotToRemove) {
          removed = true;
          return false;
        }

        return true;
      }
    );
  }

  public isScheduleValid(): boolean {
    if (this.form.schedule.length === 0) return false;

    return (
      this.form.schedule.every(slot => {
        return (
          Number.isInteger(Number(slot.dayOfWeek)) &&
          slot.dayOfWeek >= 0 &&
          slot.dayOfWeek <= 6 &&
          this.isValidTime(slot.startTime) &&
          this.isValidTime(slot.endTime) &&
          slot.startTime < slot.endTime
        );
      }) && !this.hasScheduleOverlaps()
    );
  }

  public statusBadgeClass(): string {
    return this.center?.active
      ? 'badge-soft-success border-success text-success'
      : 'badge-soft-danger border-danger text-danger';
  }

  private loadCenter(id: number): void {
    this.isLoading = true;
    this.clearMessages();

    this.centersService
      .getCenter(id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: center => {
          this.center = center;
          this.form = this.mapCenterToForm(center);
        },
        error: () => {
          this.errorMessage = this.translate('centers.errors.load');
        },
      });
  }

  private mapCenterToForm(center: Center): CenterForm {
    return {
      name: center.name,
      city: center.city ?? '',
      logoUrl: center.logoUrl ?? '',
      schedule: this.cloneSchedule(
        center.schedule?.length ? center.schedule : this.getDefaultSchedule()
      ),
    };
  }

  private getPayload(): CenterPayload {
    const city = this.form.city.trim();
    const logoUrl = this.form.logoUrl.trim();

    return {
      name: this.form.name.trim(),
      city: city || null,
      logoUrl: logoUrl || null,
      schedule: this.getSchedulePayload(),
    };
  }

  private getEmptyForm(): CenterForm {
    return {
      name: '',
      city: '',
      logoUrl: '',
      schedule: this.getDefaultSchedule(),
    };
  }

  private getDefaultSchedule(): CenterScheduleSlot[] {
    return [
      { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 1, startTime: '16:00', endTime: '20:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 2, startTime: '16:00', endTime: '20:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 3, startTime: '16:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 4, startTime: '16:00', endTime: '20:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '17:00' },
    ];
  }

  private getSchedulePayload(): CenterScheduleSlot[] {
    return this.cloneSchedule(this.form.schedule).sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
    );
  }

  private cloneSchedule(schedule: CenterScheduleSlot[]): CenterScheduleSlot[] {
    return schedule.map(slot => ({
      dayOfWeek: Number(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private translate(key: string): string {
    return this.i18nService.translate(key);
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  private hasScheduleOverlaps(): boolean {
    return this.form.schedule.some((slot, index) =>
      this.form.schedule.some((otherSlot, otherIndex) => {
        if (
          index === otherIndex ||
          Number(slot.dayOfWeek) !== Number(otherSlot.dayOfWeek)
        ) {
          return false;
        }

        return (
          slot.startTime < otherSlot.endTime &&
          slot.endTime > otherSlot.startTime
        );
      })
    );
  }
}
