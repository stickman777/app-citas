import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import {
  ClientPortalAppointment,
  ClientPortalAppointmentRequest,
  ClientPortalAppointmentRequestStatus,
  ClientPortalService,
} from '../../../core/client-portal/client-portal.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AppointmentStatus } from '../../../core/appointments/appointments.service';

@Component({
  selector: 'app-client-appointments',
  templateUrl: './client-appointments.component.html',
  styleUrls: ['./client-appointments.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class ClientAppointmentsComponent implements OnInit {
  public appointments: ClientPortalAppointment[] = [];
  public requests: ClientPortalAppointmentRequest[] = [];
  public selectedAppointment: ClientPortalAppointment | null = null;
  public isLoading = false;
  public errorMessage = '';

  constructor(private readonly clientPortalService: ClientPortalService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  public loadAppointments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      appointments: this.clientPortalService.getAppointments(),
      requests: this.clientPortalService.getAppointmentRequests(),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ appointments, requests }) => {
          this.appointments = [...appointments].sort(
            (first, second) =>
              new Date(second.startDateTime).getTime() -
              new Date(first.startDateTime).getTime(),
          );
          this.requests = [...requests].sort(
            (first, second) =>
              new Date(second.requestedStartDateTime).getTime() -
              new Date(first.requestedStartDateTime).getTime(),
          );
        },
        error: () => {
          this.errorMessage = 'client.appointments.errors.load';
        },
      });
  }

  public statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      SCHEDULED: 'appointments.status.scheduled',
      COMPLETED: 'appointments.status.completed',
      CANCELLED: 'appointments.status.cancelled',
    };

    return labels[status];
  }

  public statusClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      SCHEDULED: 'client-status-scheduled',
      COMPLETED: 'client-status-completed',
      CANCELLED: 'client-status-cancelled',
    };

    return classes[status];
  }

  public requestStatusLabel(
    status: ClientPortalAppointmentRequestStatus,
  ): string {
    const labels: Record<ClientPortalAppointmentRequestStatus, string> = {
      PENDING: 'client.requests.status.pending',
      APPROVED: 'client.requests.status.approved',
      REJECTED: 'client.requests.status.rejected',
    };

    return labels[status];
  }

  public requestStatusClass(
    status: ClientPortalAppointmentRequestStatus,
  ): string {
    const classes: Record<ClientPortalAppointmentRequestStatus, string> = {
      PENDING: 'client-status-scheduled',
      APPROVED: 'client-status-completed',
      REJECTED: 'client-status-cancelled',
    };

    return classes[status];
  }

  public requestReasonKey(request: ClientPortalAppointmentRequest): string {
    return request.outsideAvailability
      ? 'appointmentRequests.reason.outside'
      : 'appointmentRequests.reason.occupied';
  }

  public openAppointment(appointment: ClientPortalAppointment): void {
    this.selectedAppointment = appointment;
  }

  public closeAppointment(): void {
    this.selectedAppointment = null;
  }

  public trackByAppointmentId(
    _: number,
    appointment: ClientPortalAppointment,
  ): number {
    return appointment.id;
  }

  public trackByRequestId(
    _: number,
    request: ClientPortalAppointmentRequest,
  ): number {
    return request.id;
  }
}
