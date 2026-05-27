import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Subscription } from 'rxjs';

import { ActiveCenterService } from '../../../core/centers/active-center.service';
import { Center, CentersService } from '../../../core/centers/centers.service';
import {
  Appointment,
  AppointmentClient,
  AppointmentPayload,
  AppointmentServiceOption,
  AppointmentStatus,
  AppointmentsService,
} from '../../../core/appointments/appointments.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

interface AppointmentForm {
  startDateTime: string;
  clientId: number | null;
  serviceId: number | null;
}

const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  SCHEDULED: 'badge-soft-primary border-primary text-primary',
  COMPLETED: 'badge-soft-success border-success text-success',
  CANCELLED: 'badge-soft-danger border-danger text-danger',
};

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class AppointmentComponent implements OnInit, OnDestroy {
  public appointments: Appointment[] = [];
  public filteredAppointments: Appointment[] = [];
  public clients: AppointmentClient[] = [];
  public services: AppointmentServiceOption[] = [];
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
  public editingAppointment: Appointment | null = null;
  public appointmentToDelete: Appointment | null = null;
  public form: AppointmentForm = this.getEmptyForm();
  private activeCenterSubscription?: Subscription;
  private loadedCenterId: number | null = null;

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly centersService: CentersService,
    private readonly activeCenterService: ActiveCenterService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadCenters();
    this.activeCenterSubscription = this.activeCenterService.activeCenter$.subscribe(
      center => {
        const centerId = center?.id ?? null;

        if (centerId === this.loadedCenterId) return;

        this.activeCenter = center;
        this.loadedCenterId = centerId;
        this.loadReferenceData();
        this.loadAppointments();
      }
    );
  }

  ngOnDestroy(): void {
    this.activeCenterSubscription?.unsubscribe();
  }

  public loadAppointments(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    this.appointmentsService.getAppointments(this.activeCenter?.id).subscribe({
      next: appointments => {
        this.appointments = appointments;
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.translate('appointments.errors.load');
        this.isLoading = false;
      },
    });
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.editingAppointment = null;
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public openEditModal(appointment: Appointment): void {
    this.clearMessages();
    this.editingAppointment = appointment;
    this.form = {
      startDateTime: this.toDateTimeInputValue(appointment.startDateTime),
      clientId: appointment.client.id,
      serviceId: appointment.service.id,
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveAppointment(): void {
    if (!this.isFormComplete()) {
      this.errorMessage = this.translate('appointments.errors.form');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    const payload = this.getPayload();
    const request = this.editingAppointment
      ? this.appointmentsService.updateAppointment(
          this.editingAppointment.id,
          payload,
        )
      : this.appointmentsService.createAppointment(payload);

    request
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.successMessage = this.editingAppointment
            ? this.translate('appointments.success.updated')
            : this.translate('appointments.success.created');
          this.isFormModalOpen = false;
          this.loadAppointments(false);
        },
        error: () => {
          this.errorMessage = this.translate('appointments.errors.save');
        },
      });
  }

  public openDeleteModal(appointment: Appointment): void {
    this.clearMessages();
    this.appointmentToDelete = appointment;
    this.isDeleteModalOpen = true;
  }

  public closeDeleteModal(): void {
    if (this.isDeleting) return;

    this.isDeleteModalOpen = false;
  }

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isDeleteModalOpen) this.closeDeleteModal();
  }

  public deleteAppointment(): void {
    if (!this.appointmentToDelete) return;

    this.isDeleting = true;
    this.clearMessages();

    this.appointmentsService
      .deleteAppointment(this.appointmentToDelete.id)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.successMessage = this.translate('appointments.success.deleted');
          this.isDeleteModalOpen = false;
          this.appointmentToDelete = null;
          this.loadAppointments(false);
        },
        error: () => {
          this.errorMessage = this.translate('appointments.errors.delete');
        },
      });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredAppointments = search
      ? this.appointments.filter(appointment =>
          this.getSearchText(appointment).includes(search)
        )
      : [...this.appointments];
  }

  public statusBadgeClass(status: AppointmentStatus): string {
    return STATUS_BADGE_CLASSES[status];
  }

  public trackByAppointmentId(_: number, appointment: Appointment): number {
    return appointment.id;
  }

  public get clientOptions(): AppointmentClient[] {
    return this.withCurrentOption(this.clients, this.editingAppointment?.client);
  }

  public get serviceOptions(): AppointmentServiceOption[] {
    return this.withCurrentOption(this.services, this.editingAppointment?.service);
  }

  public clientOptionLabel(client: AppointmentClient): string {
    const status = client.active
      ? ''
      : ` (${this.translate('common.inactive').toLowerCase()})`;

    return `${client.name} - ${client.phone}${status}`;
  }

  public serviceOptionLabel(service: AppointmentServiceOption): string {
    const status = service.active
      ? ''
      : ` (${this.translate('common.inactive').toLowerCase()})`;

    return `${service.name} (${service.durationMinutes} min)${status}`;
  }

  public statusLabel(status: AppointmentStatus): string {
    return this.translate(`appointments.status.${status.toLowerCase()}`);
  }

  private loadReferenceData(): void {
    forkJoin({
      clients: this.appointmentsService.getClients(this.activeCenter?.id),
      services: this.appointmentsService.getServices(this.activeCenter?.id),
    }).subscribe({
      next: ({ clients, services }) => {
        this.clients = clients;
        this.services = services;
      },
      error: () => {
        this.errorMessage = this.translate('appointments.errors.references');
      },
    });
  }

  private loadCenters(): void {
    this.centersService.getCenters().subscribe({
      next: centers => {
        this.centers = centers;
        this.activeCenterService.setAvailableCenters(centers);
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.load');
      },
    });
  }

  private getPayload(): AppointmentPayload {
    return {
      startDateTime: this.normalizeDateTime(this.form.startDateTime),
      clientId: Number(this.form.clientId),
      serviceId: Number(this.form.serviceId),
    };
  }

  private isFormComplete(): boolean {
    return (
      !!this.form.clientId &&
      !!this.form.serviceId &&
      !!this.form.startDateTime
    );
  }

  private getSearchText(appointment: Appointment): string {
    return [
      appointment.id,
      appointment.client.name,
      appointment.client.phone,
      appointment.service.name,
      this.statusLabel(appointment.status),
      appointment.startDateTime,
    ]
      .join(' ')
      .toLowerCase();
  }

  private getEmptyForm(): AppointmentForm {
    return {
      startDateTime: '',
      clientId: null,
      serviceId: null,
    };
  }

  private normalizeDateTime(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
  }

  private toDateTimeInputValue(value: string): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private withCurrentOption<T extends { id: number }>(
    options: T[],
    current?: T,
  ): T[] {
    if (!current || options.some(option => option.id === current.id)) {
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
