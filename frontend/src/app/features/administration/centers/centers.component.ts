import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  Center,
  CenterPayload,
  CenterScheduleSlot,
  CentersService,
} from '../../../core/centers/centers.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

interface CenterForm {
  name: string;
  city: string;
  logoUrl: string;
  schedule: CenterScheduleSlot[];
}

@Component({
  selector: 'app-centers',
  templateUrl: './centers.component.html',
  styleUrls: ['./centers.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
})
export class CentersComponent {
  public readonly dayOptions = [1, 2, 3, 4, 5, 6, 0];
  public centers: Center[] = [];
  public filteredCenters: Center[] = [];
  public searchTerm = '';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isChangingStatus = false;
  public showAll = false;
  public isFormModalOpen = false;
  public isStatusModalOpen = false;
  public centerToChangeStatus: Center | null = null;
  public selectedStatus = true;
  public form: CenterForm = this.getEmptyForm();

  constructor(
    private readonly centersService: CentersService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadCenters();
  }

  public loadCenters(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    const request = this.showAll
      ? this.centersService.getAllCenters()
      : this.centersService.getCenters();

    request.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: centers => {
        this.centers = centers;
        this.applySearch();
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.load');
      },
    });
  }

  public toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.loadCenters();
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveCenter(): void {
    if (!this.form.name.trim() || !this.isScheduleValid()) {
      this.errorMessage = this.translate('centers.errors.form');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    const request = this.centersService.createCenter(this.getPayload());

    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.successMessage = this.translate('centers.success.created');
        this.isFormModalOpen = false;
        this.loadCenters(false);
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.save');
      },
    });
  }

  public openStatusModal(center: Center): void {
    this.clearMessages();
    this.centerToChangeStatus = center;
    this.selectedStatus = center.active;
    this.isStatusModalOpen = true;
  }

  public closeStatusModal(): void {
    if (this.isChangingStatus) return;

    this.isStatusModalOpen = false;
  }

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isStatusModalOpen) this.closeStatusModal();
  }

  public changeCenterStatus(): void {
    if (!this.centerToChangeStatus) return;

    const center = this.centerToChangeStatus;

    if (center.active === this.selectedStatus) {
      this.isStatusModalOpen = false;
      this.centerToChangeStatus = null;
      return;
    }

    this.isChangingStatus = true;
    this.clearMessages();

    const request = this.selectedStatus
      ? this.centersService.activateCenter(center.id)
      : this.centersService.deactivateCenter(center.id);

    request.pipe(finalize(() => (this.isChangingStatus = false))).subscribe({
      next: () => {
        this.successMessage = this.selectedStatus
          ? this.translate('centers.success.activated')
          : this.translate('centers.success.deactivated');
        this.isStatusModalOpen = false;
        this.centerToChangeStatus = null;
        this.loadCenters(false);
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.status');
      },
    });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredCenters = search
      ? this.centers.filter(center =>
          `${center.id} ${center.name} ${center.city ?? ''} ${center.logoUrl ?? ''}`
            .toLowerCase()
            .includes(search)
        )
      : [...this.centers];
  }

  public statusBadgeClass(center: Center): string {
    return center.active
      ? 'badge-soft-success border-success text-success'
      : 'badge-soft-danger border-danger text-danger';
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
  }

  public trackByScheduleIndex(index: number): number {
    return index;
  }

  public addScheduleSlot(): void {
    this.form.schedule = [
      ...this.form.schedule,
      { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
    ];
  }

  public removeScheduleSlot(index: number): void {
    this.form.schedule = this.form.schedule.filter(
      (_, slotIndex) => slotIndex !== index
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

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private translate(key: string): string {
    return this.i18nService.translate(key);
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
