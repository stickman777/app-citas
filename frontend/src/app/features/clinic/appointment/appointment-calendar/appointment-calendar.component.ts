import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import {
  Availability,
  AvailabilityPayload,
  AvailabilityService,
} from '../../../../core/availability/availability.service';
import { ActiveCenterService } from '../../../../core/centers/active-center.service';
import {
  Center,
  CentersService,
} from '../../../../core/centers/centers.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

interface AvailabilityForm {
  centerId: number | null;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-appointment-calendar',
  templateUrl: './appointment-calendar.component.html',
  styleUrls: ['./appointment-calendar.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class AppointmentCalendarComponent implements OnInit, OnDestroy {
  public availabilities: Availability[] = [];
  public filteredAvailabilities: Availability[] = [];
  public centers: Center[] = [];
  public activeCenter: Center | null = null;
  public searchTerm = '';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isDeleting = false;
  public isFormModalOpen = false;
  public isDeleteModalOpen = false;
  public editingAvailability: Availability | null = null;
  public availabilityToDelete: Availability | null = null;
  public form: AvailabilityForm = this.getEmptyForm();
  private activeCenterSubscription?: Subscription;
  private loadedCenterId?: number | null;

  public readonly days = [1, 2, 3, 4, 5, 6, 0];

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly centersService: CentersService,
    private readonly activeCenterService: ActiveCenterService,
    private readonly i18nService: I18nService,
  ) {}

  ngOnInit(): void {
    this.loadCenters();
    this.activeCenterSubscription =
      this.activeCenterService.activeCenter$.subscribe((center) => {
        const centerId = center?.id ?? null;

        if (centerId === this.loadedCenterId) return;

        this.activeCenter = center;
        this.loadedCenterId = centerId;
        this.loadAvailability();
      });
  }

  ngOnDestroy(): void {
    this.activeCenterSubscription?.unsubscribe();
  }

  public loadAvailability(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    this.availabilityService
      .getAvailability(this.activeCenter?.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (availabilities) => {
          this.availabilities = availabilities;
          this.applySearch();
        },
        error: () => {
          this.errorMessage = this.translate('availability.errors.load');
        },
      });
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.editingAvailability = null;
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public openEditModal(availability: Availability): void {
    this.clearMessages();
    this.editingAvailability = availability;
    this.form = {
      centerId: availability.center?.id ?? this.activeCenter?.id ?? null,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveAvailability(): void {
    if (!this.isFormValid()) {
      this.errorMessage = this.translate('availability.errors.form');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    const payload = this.getPayload();
    const request = this.editingAvailability
      ? this.availabilityService.updateAvailability(
          this.editingAvailability.id,
          payload,
        )
      : this.availabilityService.createAvailability(payload);

    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingAvailability
          ? this.translate('availability.success.updated')
          : this.translate('availability.success.created');
        this.isFormModalOpen = false;
        this.loadAvailability(false);
      },
      error: () => {
        this.errorMessage = this.translate('availability.errors.save');
      },
    });
  }

  public openDeleteModal(availability: Availability): void {
    this.clearMessages();
    this.availabilityToDelete = availability;
    this.isDeleteModalOpen = true;
  }

  public closeDeleteModal(): void {
    if (this.isDeleting) return;

    this.isDeleteModalOpen = false;
  }

  public deleteAvailability(): void {
    if (!this.availabilityToDelete) return;

    this.isDeleting = true;
    this.clearMessages();

    this.availabilityService
      .deleteAvailability(this.availabilityToDelete.id)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.successMessage = this.translate('availability.success.deleted');
          this.isDeleteModalOpen = false;
          this.availabilityToDelete = null;
          this.loadAvailability(false);
        },
        error: () => {
          this.errorMessage = this.translate('availability.errors.delete');
        },
      });
  }

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isDeleteModalOpen) this.closeDeleteModal();
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredAvailabilities = search
      ? this.availabilities.filter((availability) =>
          `${availability.id} ${this.dayLabel(availability.dayOfWeek)} ${availability.startTime} ${availability.endTime} ${availability.center?.name ?? ''}`
            .toLowerCase()
            .includes(search),
        )
      : [...this.availabilities];
  }

  public dayLabel(dayOfWeek: number): string {
    return this.translate(`availability.days.${dayOfWeek}`);
  }

  public centerName(availability: Availability): string {
    return availability.center?.name ?? this.translate('centers.none');
  }

  public trackByAvailabilityId(_: number, availability: Availability): number {
    return availability.id;
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
  }

  public trackByDay(_: number, day: number): number {
    return day;
  }

  public get centerOptions(): Center[] {
    return this.withCurrentOption(
      this.centers,
      this.editingAvailability?.center,
    );
  }

  public isFormValid(): boolean {
    return (
      !!this.form.centerId &&
      this.form.dayOfWeek !== null &&
      !!this.form.startTime &&
      !!this.form.endTime &&
      this.form.startTime < this.form.endTime
    );
  }

  private loadCenters(): void {
    this.centersService.getCenters().subscribe({
      next: (centers) => {
        this.centers = centers;
        this.activeCenterService.setAvailableCenters(centers);
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.load');
      },
    });
  }

  private getPayload(): AvailabilityPayload {
    return {
      centerId: Number(this.form.centerId),
      dayOfWeek: Number(this.form.dayOfWeek),
      startTime: this.form.startTime,
      endTime: this.form.endTime,
    };
  }

  private getEmptyForm(): AvailabilityForm {
    return {
      centerId: this.activeCenter?.id ?? null,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '14:00',
    };
  }

  private withCurrentOption<T extends { id: number }>(
    options: T[],
    current?: T | null,
  ): T[] {
    if (!current || options.some((option) => option.id === current.id)) {
      return options;
    }

    return [current, ...options];
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private translate(key: string): string {
    return this.i18nService.translate(key);
  }
}
