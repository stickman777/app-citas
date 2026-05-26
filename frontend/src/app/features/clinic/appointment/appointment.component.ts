import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import {
  Appointment,
  AppointmentClient,
  AppointmentPayload,
  AppointmentServiceOption,
  AppointmentStatus,
  AppointmentsService,
} from '../../../core/appointments/appointments.service';

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
  imports: [CommonModule, FormsModule],
})
export class AppointmentComponent {
  public appointments: Appointment[] = [];
  public filteredAppointments: Appointment[] = [];
  public clients: AppointmentClient[] = [];
  public services: AppointmentServiceOption[] = [];
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

  constructor(private readonly appointmentsService: AppointmentsService) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadAppointments();
  }

  public loadAppointments(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    this.appointmentsService.getAppointments().subscribe({
      next: appointments => {
        this.appointments = appointments;
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se han podido cargar las citas.';
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
      this.errorMessage = 'Completa todos los campos obligatorios.';
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
            ? 'Cita actualizada correctamente.'
            : 'Cita creada correctamente.';
          this.isFormModalOpen = false;
          this.loadAppointments(false);
        },
        error: () => {
          this.errorMessage = 'No se ha podido guardar la cita.';
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

  public deleteAppointment(): void {
    if (!this.appointmentToDelete) return;

    this.isDeleting = true;
    this.clearMessages();

    this.appointmentsService
      .deleteAppointment(this.appointmentToDelete.id)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Cita eliminada correctamente.';
          this.isDeleteModalOpen = false;
          this.appointmentToDelete = null;
          this.loadAppointments(false);
        },
        error: () => {
          this.errorMessage = 'No se ha podido eliminar la cita.';
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
    return `${client.name} - ${client.phone}${client.active ? '' : ' (inactivo)'}`;
  }

  public serviceOptionLabel(service: AppointmentServiceOption): string {
    const status = service.active ? '' : ' (inactivo)';

    return `${service.name} (${service.durationMinutes} min)${status}`;
  }

  private loadReferenceData(): void {
    forkJoin({
      clients: this.appointmentsService.getClients(),
      services: this.appointmentsService.getServices(),
    }).subscribe({
      next: ({ clients, services }) => {
        this.clients = clients;
        this.services = services;
      },
      error: () => {
        this.errorMessage = 'No se han podido cargar clientes o servicios.';
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
      appointment.status,
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
}
