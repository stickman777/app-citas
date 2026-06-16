import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, forkJoin, fromEvent, Subscription } from 'rxjs';

import {
  ClientPortalAppointment,
  ClientPortalAppointmentRequest,
  ClientPortalAppointmentRequestStatus,
  ClientPortalService,
} from '../../../core/client-portal/client-portal.service';
import { ClientPortalOfflineCacheService } from '../../../core/client-portal/client-portal-offline-cache.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AppointmentStatus } from '../../../core/appointments/appointments.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-client-appointments',
  templateUrl: './client-appointments.component.html',
  styleUrls: ['./client-appointments.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class ClientAppointmentsComponent implements OnInit, OnDestroy {
  public appointments: ClientPortalAppointment[] = [];
  public requests: ClientPortalAppointmentRequest[] = [];
  public selectedAppointment: ClientPortalAppointment | null = null;
  public isLoading = false;
  public isOfflineData = false;
  public errorMessage = '';

  private onlineSubscription?: Subscription;

  constructor(
    private readonly clientPortalService: ClientPortalService,
    private readonly offlineCache: ClientPortalOfflineCacheService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.onlineSubscription = fromEvent(window, 'online').subscribe(() =>
      this.loadAppointments(),
    );
  }

  ngOnDestroy(): void {
    this.onlineSubscription?.unsubscribe();
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
          this.setAppointments(appointments, requests);
          this.isOfflineData = false;

          const userId = this.authService.currentUser?.id;

          if (userId) {
            this.offlineCache.saveAppointments(
              userId,
              this.appointments,
              this.requests,
            );
          }
        },
        error: () => {
          const userId = this.authService.currentUser?.id;
          const cachedData = userId
            ? this.offlineCache.getAppointments(userId)
            : null;

          if (cachedData) {
            this.setAppointments(
              cachedData.appointments,
              cachedData.requests,
            );
            this.isOfflineData = true;
            return;
          }

          this.isOfflineData = false;
          this.errorMessage = 'client.appointments.errors.load';
        },
      });
  }

  private setAppointments(
    appointments: ClientPortalAppointment[],
    requests: ClientPortalAppointmentRequest[],
  ): void {
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
