import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { ActiveCenterService } from '../../../core/centers/active-center.service';
import { Center } from '../../../core/centers/centers.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import {
  AppointmentRequest,
  AppointmentRequestsService,
} from '../../../core/appointment-requests/appointment-requests.service';

@Component({
  selector: 'app-appointment-requests',
  templateUrl: './appointment-requests.component.html',
  styleUrls: ['./appointment-requests.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class AppointmentRequestsComponent implements OnInit, OnDestroy {
  public requests: AppointmentRequest[] = [];
  public activeCenter: Center | null = null;
  public isLoading = false;
  public resolvingId: number | null = null;
  public errorMessage = '';
  public successMessage = '';
  public requestToReject: AppointmentRequest | null = null;
  public rejectNote = '';

  private activeCenterSubscription?: Subscription;
  private loadedCenterId?: number | null;

  constructor(
    private readonly appointmentRequestsService: AppointmentRequestsService,
    private readonly activeCenterService: ActiveCenterService,
  ) {}

  ngOnInit(): void {
    this.activeCenterSubscription =
      this.activeCenterService.activeCenter$.subscribe(center => {
        const centerId = center?.id ?? null;

        if (centerId === this.loadedCenterId) return;

        this.activeCenter = center;
        this.loadedCenterId = centerId;
        this.loadRequests();
      });
  }

  ngOnDestroy(): void {
    this.activeCenterSubscription?.unsubscribe();
  }

  public loadRequests(): void {
    this.isLoading = true;
    this.clearMessages();

    this.appointmentRequestsService
      .getPending(this.activeCenter?.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: requests => {
          this.requests = requests;
        },
        error: () => {
          this.errorMessage = 'appointmentRequests.errors.load';
        },
      });
  }

  public approve(request: AppointmentRequest): void {
    this.resolvingId = request.id;
    this.clearMessages();

    this.appointmentRequestsService
      .resolve(request.id, { action: 'APPROVE' })
      .pipe(finalize(() => (this.resolvingId = null)))
      .subscribe({
        next: () => {
          this.successMessage = 'appointmentRequests.success.approved';
          this.removeRequest(request.id);
        },
        error: error => {
          this.errorMessage =
            error?.status === 409
              ? 'appointmentRequests.errors.conflict'
              : 'appointmentRequests.errors.resolve';
        },
      });
  }

  public openRejectModal(request: AppointmentRequest): void {
    this.requestToReject = request;
    this.rejectNote = '';
  }

  public closeRejectModal(): void {
    this.requestToReject = null;
    this.rejectNote = '';
  }

  public confirmReject(): void {
    if (!this.requestToReject) return;

    const requestId = this.requestToReject.id;
    this.resolvingId = requestId;
    this.clearMessages();

    this.appointmentRequestsService
      .resolve(requestId, {
        action: 'REJECT',
        resolutionNote: this.rejectNote.trim() || undefined,
      })
      .pipe(finalize(() => (this.resolvingId = null)))
      .subscribe({
        next: () => {
          this.successMessage = 'appointmentRequests.success.rejected';
          this.removeRequest(requestId);
          this.closeRejectModal();
        },
        error: () => {
          this.errorMessage = 'appointmentRequests.errors.resolve';
        },
      });
  }

  public reasonKey(request: AppointmentRequest): string {
    return request.outsideAvailability
      ? 'appointmentRequests.reason.outside'
      : 'appointmentRequests.reason.occupied';
  }

  public trackById(_: number, request: AppointmentRequest): number {
    return request.id;
  }

  private removeRequest(id: number): void {
    this.requests = this.requests.filter(request => request.id !== id);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
