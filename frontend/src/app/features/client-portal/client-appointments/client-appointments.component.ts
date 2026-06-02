import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import {
  ClientPortalAppointment,
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
  public isLoading = false;
  public errorMessage = '';

  constructor(private readonly clientPortalService: ClientPortalService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  public loadAppointments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.clientPortalService.getAppointments().subscribe({
      next: appointments => {
        this.appointments = appointments;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'client.appointments.errors.load';
        this.isLoading = false;
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

  public trackByAppointmentId(
    _: number,
    appointment: ClientPortalAppointment,
  ): number {
    return appointment.id;
  }
}
