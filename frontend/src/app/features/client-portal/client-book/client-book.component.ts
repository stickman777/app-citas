import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  ClientPortalService,
  ClientPortalServiceOption,
  ClientPortalSpecialist,
} from '../../../core/client-portal/client-portal.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { routes } from '../../../shared/routes/routes';

@Component({
  selector: 'app-client-book',
  templateUrl: './client-book.component.html',
  styleUrls: ['./client-book.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class ClientBookComponent implements OnInit {
  services: ClientPortalServiceOption[] = [];
  specialists: ClientPortalSpecialist[] = [];
  availableSlots: string[] = [];
  selectedServiceId: number | null = null;
  selectedSpecialistId: number | null = null;
  selectedDate = '';
  selectedSlot = '';
  minDate = this.toDateInputValue(new Date());
  minDateTime = this.toDateTimeInputValue(new Date());
  requestDateTime = '';
  requestNotes = '';
  isLoading = false;
  isLoadingSlots = false;
  isSaving = false;
  isRequesting = false;
  errorMessage = '';
  successMessage = '';
  requestErrorMessage = '';
  requestSuccessMessage = '';
  requestFormSubmitted = false;

  constructor(
    private readonly clientPortalService: ClientPortalService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadReferences();
  }

  get selectedService(): ClientPortalServiceOption | undefined {
    return this.services.find((service) => service.id === this.selectedServiceId);
  }

  loadReferences(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      services: this.clientPortalService.getServices(),
      specialists: this.clientPortalService.getSpecialists(),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ services, specialists }) => {
          this.services = services;
          this.specialists = specialists;
        },
        error: () => {
          this.errorMessage = 'client.book.errors.references';
        },
      });
  }

  onServiceChange(): void {
    this.selectedSpecialistId = null;
    this.selectedSlot = '';
    this.availableSlots = [];

    if (!this.selectedServiceId) {
      this.specialists = [];
      return;
    }

    this.clientPortalService.getSpecialists(this.selectedServiceId).subscribe({
      next: (specialists) => {
        this.specialists = specialists;

        if (specialists.length === 1) {
          this.selectedSpecialistId = specialists[0].id;
          this.loadAvailableSlots();
        }
      },
      error: () => {
        this.errorMessage = 'client.book.errors.references';
      },
    });
  }

  onBookingDataChange(): void {
    this.selectedSlot = '';
    this.availableSlots = [];
    this.loadAvailableSlots();
  }

  loadAvailableSlots(): void {
    if (!this.selectedDate || !this.selectedServiceId || !this.selectedSpecialistId)
      return;

    this.isLoadingSlots = true;
    this.errorMessage = '';

    this.clientPortalService
      .getAvailableSlots(
        this.selectedDate,
        this.selectedServiceId,
        this.selectedSpecialistId,
      )
      .pipe(finalize(() => (this.isLoadingSlots = false)))
      .subscribe({
        next: (slots) => {
          this.availableSlots = slots;
        },
        error: () => {
          this.errorMessage = 'client.book.errors.slots';
        },
      });
  }

  selectSlot(slot: string): void {
    this.selectedSlot = slot;
  }

  submit(): void {
    if (!this.selectedServiceId || !this.selectedSpecialistId || !this.selectedDate || !this.selectedSlot) {
      this.errorMessage = 'client.book.errors.form';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.clientPortalService
      .createAppointment({
        serviceId: this.selectedServiceId,
        specialistId: this.selectedSpecialistId,
        startDateTime: `${this.selectedDate}T${this.selectedSlot}:00`,
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'client.book.success.created';
          void this.router.navigate([routes.clientAppointments]);
        },
        error: () => {
          this.errorMessage = 'client.book.errors.save';
        },
      });
  }

  submitRequest(form: NgForm): void {
    this.requestFormSubmitted = true;
    this.requestErrorMessage = '';
    this.requestSuccessMessage = '';

    if (!this.selectedServiceId || !this.selectedSpecialistId || !this.requestDateTime) {
      form.control.markAllAsTouched();
      this.requestErrorMessage = 'client.book.request.errors.form';
      return;
    }

    this.isRequesting = true;

    this.clientPortalService
      .createAppointmentRequest({
        serviceId: this.selectedServiceId,
        specialistId: this.selectedSpecialistId,
        startDateTime: `${this.requestDateTime}:00`,
        notes: this.requestNotes.trim() || undefined,
      })
      .pipe(finalize(() => (this.isRequesting = false)))
      .subscribe({
        next: () => {
          this.requestSuccessMessage = 'client.book.request.success';
          this.requestDateTime = '';
          this.requestNotes = '';
          this.requestFormSubmitted = false;
          form.resetForm({
            requestDateTime: '',
            requestNotes: '',
          });
        },
        error: (error) => {
          this.requestErrorMessage = this.getApiErrorMessage(
            error,
            'client.book.request.errors.save',
          );
        },
      });
  }

  trackByServiceId(_: number, service: ClientPortalServiceOption): number {
    return service.id;
  }

  trackBySpecialistId(_: number, specialist: ClientPortalSpecialist): number {
    return specialist.id;
  }

  trackBySlot(_: number, slot: string): string {
    return slot;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toDateTimeInputValue(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${this.toDateInputValue(date)}T${hours}:${minutes}`;
  }

  private getApiErrorMessage(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallbackKey;

    const apiMessage = this.extractApiErrorMessage(
      error.error?.message ?? error.error,
    );

    return apiMessage || fallbackKey;
  }

  private extractApiErrorMessage(message: unknown): string {
    if (typeof message === 'string') return message;

    if (Array.isArray(message)) {
      const firstMessage = message.find(item => typeof item === 'string');

      return firstMessage ?? '';
    }

    return '';
  }
}
