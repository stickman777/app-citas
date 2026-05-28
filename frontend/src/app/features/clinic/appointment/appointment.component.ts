import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  subDays,
} from 'date-fns';

import { ActiveCenterService } from '../../../core/centers/active-center.service';
import {
  Center,
  CenterScheduleSlot,
  CentersService,
} from '../../../core/centers/centers.service';
import {
  Appointment,
  AppointmentClient,
  AppointmentPayload,
  AppointmentServiceOption,
  AppointmentStatus,
  AppointmentsService,
} from '../../../core/appointments/appointments.service';
import {
  AvailabilityException,
  AvailabilityExceptionPayload,
  AvailabilityExceptionType,
  AvailabilityService,
} from '../../../core/availability/availability.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { CalendarWrapperModule } from '../../../shared/calendar/calendar-wrapper.module';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';

interface AppointmentForm {
  startDateTime: string;
  clientId: number | null;
  serviceId: number | null;
  allowOutsideAvailability: boolean;
}

interface AvailabilityExceptionForm {
  date: string;
  startTime: string;
  endTime: string;
  type: AvailabilityExceptionType;
  label: string;
}

interface TimeRange {
  startTime: string;
  endTime: string;
}

const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  SCHEDULED: 'badge-soft-primary border-primary text-primary',
  COMPLETED: 'badge-soft-success border-success text-success',
  CANCELLED: 'badge-soft-danger border-danger text-danger',
};

type AppointmentViewMode = 'calendar' | 'list';

type AppointmentCalendarEventMeta =
  | { type: 'appointment'; appointment: Appointment }
  | { type: 'availability' }
  | { type: 'exception'; exception: AvailabilityException };

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe, CalendarWrapperModule],
})
export class AppointmentComponent implements OnInit, OnDestroy {
  public readonly CalendarView = CalendarView;
  public appointments: Appointment[] = [];
  public filteredAppointments: Appointment[] = [];
  public calendarEvents: CalendarEvent<AppointmentCalendarEventMeta>[] = [];
  public availabilityExceptions: AvailabilityException[] = [];
  public clients: AppointmentClient[] = [];
  public services: AppointmentServiceOption[] = [];
  public centers: Center[] = [];
  public activeCenter: Center | null = null;
  public currentUser: CurrentUser | null = null;
  public viewMode: AppointmentViewMode = 'calendar';
  public calendarView: CalendarView = CalendarView.Week;
  public calendarViewDate = new Date();
  public searchTerm = '';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isDeleting = false;
  public isSavingException = false;
  public isDeletingException = false;
  public isFormModalOpen = false;
  public isDeleteModalOpen = false;
  public isSlotActionModalOpen = false;
  public isExceptionModalOpen = false;
  public editingAppointment: Appointment | null = null;
  public appointmentToDelete: Appointment | null = null;
  public editingException: AvailabilityException | null = null;
  public selectedCalendarEvent: CalendarEvent<AppointmentCalendarEventMeta> | null = null;
  public form: AppointmentForm = this.getEmptyForm();
  public exceptionForm: AvailabilityExceptionForm = this.getEmptyExceptionForm();
  private activeCenterSubscription?: Subscription;
  private loadedCenterId: number | null = null;

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: AvailabilityService,
    private readonly centersService: CentersService,
    private readonly authService: AuthService,
    private readonly activeCenterService: ActiveCenterService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCenters();
    this.activeCenterSubscription = this.activeCenterService.activeCenter$.subscribe(
      center => {
        const centerId = center?.id ?? null;

        if (centerId === this.loadedCenterId) return;

        this.activeCenter = center;
        this.loadedCenterId = centerId;
        this.loadReferenceData();
        this.loadAppointments();
        this.loadAvailabilityExceptions();
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
        this.updateCalendarEvents();
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

  public openCreateModalFromCalendarEvent(): void {
    if (!this.selectedCalendarEvent) return;

    this.clearMessages();
    this.editingAppointment = null;
    this.form = {
      ...this.getEmptyForm(),
      startDateTime: this.toDateTimeInputValue(this.selectedCalendarEvent.start),
    };
    this.isSlotActionModalOpen = false;
    this.isFormModalOpen = true;
  }

  public openEditModal(appointment: Appointment): void {
    this.clearMessages();
    this.editingAppointment = appointment;
    this.form = {
      startDateTime: this.toDateTimeInputValue(appointment.startDateTime),
      clientId: appointment.client.id,
      serviceId: appointment.service.id,
      allowOutsideAvailability: appointment.outsideAvailability,
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

    if (this.isOutsideFixedSchedule() && !this.form.allowOutsideAvailability) {
      this.errorMessage = this.translate('appointments.errors.outsideAvailability');
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

  public closeSlotActionModal(): void {
    this.isSlotActionModalOpen = false;
    this.selectedCalendarEvent = null;
  }

  public closeExceptionModal(): void {
    if (this.isSavingException || this.isDeletingException) return;

    this.isExceptionModalOpen = false;
    this.editingException = null;
  }

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isDeleteModalOpen) this.closeDeleteModal();
    if (this.isSlotActionModalOpen) this.closeSlotActionModal();
    if (this.isExceptionModalOpen) this.closeExceptionModal();
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

  public get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  public get appointmentTableColumnCount(): number {
    return this.isAdmin ? 8 : 7;
  }

  public setViewMode(viewMode: AppointmentViewMode): void {
    this.viewMode = viewMode;

    if (viewMode === 'calendar') {
      this.loadAvailabilityExceptions(false);
    }
  }

  public setCalendarView(view: CalendarView): void {
    this.calendarView = view;
    this.loadAvailabilityExceptions(false);
  }

  public goToToday(): void {
    this.calendarViewDate = new Date();
    this.loadAvailabilityExceptions(false);
  }

  public goToPreviousPeriod(): void {
    this.calendarViewDate = this.changeCalendarDate(-1);
    this.loadAvailabilityExceptions(false);
  }

  public goToNextPeriod(): void {
    this.calendarViewDate = this.changeCalendarDate(1);
    this.loadAvailabilityExceptions(false);
  }

  public openExtraAvailabilityModal(): void {
    this.clearMessages();
    this.editingException = null;
    this.exceptionForm = {
      ...this.getEmptyExceptionForm(),
      date: this.toDateQuery(this.calendarViewDate),
      type: 'EXTRA_AVAILABLE',
    };
    this.isExceptionModalOpen = true;
  }

  public handleCalendarEvent(event: CalendarEvent<AppointmentCalendarEventMeta>): void {
    if (event.meta?.type === 'appointment') {
      this.openEditModal(event.meta.appointment);
      return;
    }

    if (event.meta?.type === 'exception') {
      this.openExceptionModal(event.meta.exception);
      return;
    }

    if (event.meta?.type === 'availability') {
      this.openSlotActionModal(event);
    }
  }

  public calendarTitle(): string {
    const formatOptions: Intl.DateTimeFormatOptions =
      this.calendarView === CalendarView.Month
        ? { month: 'long', year: 'numeric' }
        : this.calendarView === CalendarView.Week
          ? { day: '2-digit', month: 'short', year: 'numeric' }
          : { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };

    return new Intl.DateTimeFormat(this.i18nService.currentLanguage, formatOptions)
      .format(this.calendarViewDate);
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

  public appointmentCenterName(appointment: Appointment): string {
    return appointment.service.center?.name ?? this.translate('centers.none');
  }

  public saveAvailabilityException(): void {
    if (!this.activeCenter || !this.isExceptionFormValid()) {
      this.errorMessage = this.translate('availability.errors.form');
      return;
    }

    this.isSavingException = true;
    this.clearMessages();

    const payload = this.getExceptionPayload();
    const request = this.editingException
      ? this.availabilityService.updateAvailabilityException(
          this.editingException.id,
          payload
        )
      : this.availabilityService.createAvailabilityException(payload);

    request
      .pipe(finalize(() => (this.isSavingException = false)))
      .subscribe({
        next: () => {
          this.successMessage = this.editingException
            ? this.translate('availability.exceptions.success.updated')
            : this.translate('availability.exceptions.success.created');
          this.isExceptionModalOpen = false;
          this.editingException = null;
          this.loadAvailabilityExceptions(false);
        },
        error: () => {
          this.errorMessage = this.translate('availability.errors.save');
        },
      });
  }

  public deleteAvailabilityException(): void {
    if (!this.editingException) return;

    this.isDeletingException = true;
    this.clearMessages();

    this.availabilityService
      .deleteAvailabilityException(this.editingException.id)
      .pipe(finalize(() => (this.isDeletingException = false)))
      .subscribe({
        next: () => {
          this.successMessage = this.translate(
            'availability.exceptions.success.deleted'
          );
          this.isExceptionModalOpen = false;
          this.editingException = null;
          this.loadAvailabilityExceptions(false);
        },
        error: () => {
          this.errorMessage = this.translate('availability.errors.delete');
        },
      });
  }

  public blockSelectedCalendarSlot(): void {
    if (!this.selectedCalendarEvent) return;

    this.clearMessages();
    this.editingException = null;
    this.exceptionForm = {
      date: this.toDateQuery(this.selectedCalendarEvent.start),
      startTime: this.toTimeValue(this.selectedCalendarEvent.start),
      endTime: this.selectedCalendarEvent.end
        ? this.toTimeValue(this.selectedCalendarEvent.end)
        : this.toTimeValue(this.selectedCalendarEvent.start),
      type: 'BLOCKED',
      label: '',
    };
    this.isSlotActionModalOpen = false;
    this.isExceptionModalOpen = true;
  }

  public isExceptionFormValid(): boolean {
    return (
      !!this.exceptionForm.date &&
      this.isValidTime(this.exceptionForm.startTime) &&
      this.isValidTime(this.exceptionForm.endTime) &&
      this.exceptionForm.startTime < this.exceptionForm.endTime
    );
  }

  public isOutsideFixedSchedule(): boolean {
    if (!this.form.startDateTime || !this.form.serviceId) return false;

    const service = this.serviceOptions.find(
      option => option.id === Number(this.form.serviceId)
    );

    if (!service) return false;

    const startDate = new Date(this.form.startDateTime);

    if (Number.isNaN(startDate.getTime())) return false;

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + service.durationMinutes);

    const dayOfWeek = startDate.getDay();
    const startTime = this.toTimeValue(startDate);
    const endTime = this.toTimeValue(endDate);
    const date = this.toDateQuery(startDate);
    const exceptions = this.getExceptionsForDate(date);
    const isBlocked = this.hasTimeOverlap(
      { startTime, endTime },
      exceptions.filter(exception => exception.type === 'BLOCKED')
    );

    if (isBlocked) return true;

    const scheduleRanges = this.resolveSchedule(service)
      .filter(slot => slot.dayOfWeek === dayOfWeek)
      .map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));
    const extraRanges = exceptions
      .filter(exception => exception.type === 'EXTRA_AVAILABLE')
      .map(exception => ({
        startTime: exception.startTime,
        endTime: exception.endTime,
      }));
    const availableRanges = [...scheduleRanges, ...extraRanges];

    if (availableRanges.length === 0) return true;

    return !availableRanges.some(slot => {
      return (
        startTime >= slot.startTime &&
        endTime <= slot.endTime
      );
    });
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

  private loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: user => {
        this.currentUser = user;
      },
      error: () => {
        this.currentUser = null;
      },
    });
  }

  private loadCenters(): void {
    this.centersService.getCenters().subscribe({
      next: centers => {
        this.centers = centers;
        this.activeCenterService.setAvailableCenters(centers);
        this.updateCalendarEvents();
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
      allowOutsideAvailability: this.isOutsideFixedSchedule()
        ? this.form.allowOutsideAvailability
        : false,
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
      appointment.outsideAvailability
        ? this.translate('appointments.outsideAvailability.badge')
        : '',
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
      allowOutsideAvailability: false,
    };
  }

  private getEmptyExceptionForm(): AvailabilityExceptionForm {
    return {
      date: '',
      startTime: '08:00',
      endTime: '14:00',
      type: 'BLOCKED',
      label: '',
    };
  }

  private getExceptionPayload(): AvailabilityExceptionPayload {
    const label = this.exceptionForm.label.trim();

    return {
      centerId: Number(this.activeCenter?.id),
      date: this.exceptionForm.date,
      startTime: this.exceptionForm.startTime,
      endTime: this.exceptionForm.endTime,
      type: this.exceptionForm.type,
      label: label || null,
    };
  }

  private normalizeDateTime(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
  }

  private loadAvailabilityExceptions(clearMessages = true): void {
    if (!this.activeCenter) {
      this.availabilityExceptions = [];
      this.updateCalendarEvents();
      return;
    }

    if (clearMessages) {
      this.clearMessages();
    }

    const range = this.getCalendarDateRange();

    this.availabilityService
      .getAvailabilityExceptions(
        this.activeCenter.id,
        this.toDateQuery(range.start),
        this.toDateQuery(range.end)
      )
      .subscribe({
        next: exceptions => {
          this.availabilityExceptions = exceptions;
          this.updateCalendarEvents();
        },
        error: () => {
          this.errorMessage = this.translate('availability.errors.load');
        },
      });
  }

  private updateCalendarEvents(): void {
    this.calendarEvents = [
      ...this.buildAvailabilityEvents(),
      ...this.buildExceptionEvents(),
      ...this.buildAppointmentEvents(),
    ].sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  private buildAppointmentEvents(): CalendarEvent<AppointmentCalendarEventMeta>[] {
    return this.appointments.map(appointment => {
      const start = new Date(appointment.startDateTime);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + appointment.duration);

      return {
        start,
        end,
        title: `${appointment.client.name} - ${appointment.service.name}`,
        color: appointment.outsideAvailability
          ? { primary: '#f59e0b', secondary: '#fef3c7' }
          : { primary: '#2e37a4', secondary: '#e6e8ff' },
        cssClass: appointment.outsideAvailability
          ? 'appointment-event appointment-event-outside'
          : 'appointment-event',
        meta: {
          type: 'appointment',
          appointment,
        },
      };
    });
  }

  private buildAvailabilityEvents(): CalendarEvent<AppointmentCalendarEventMeta>[] {
    if (!this.activeCenter?.schedule?.length) return [];

    const range = this.getCalendarDateRange();
    const events: CalendarEvent<AppointmentCalendarEventMeta>[] = [];

    for (const date of this.eachDate(range.start, range.end)) {
      const dateQuery = this.toDateQuery(date);
      const blockedExceptions = this.getExceptionsForDate(dateQuery).filter(
        exception => exception.type === 'BLOCKED'
      );
      const daySchedule = this.activeCenter.schedule.filter(
        slot => slot.dayOfWeek === date.getDay()
      );

      for (const slot of daySchedule) {
        const availableRanges = this.removeBlockedRanges(slot, blockedExceptions);

        for (const range of availableRanges) {
          events.push({
            start: this.buildDateTime(date, range.startTime),
            end: this.buildDateTime(date, range.endTime),
            title: this.translate('appointments.calendar.available'),
            color: { primary: '#10b981', secondary: '#d1fae5' },
            cssClass: 'appointment-event appointment-event-availability',
            meta: {
              type: 'availability',
            },
          });
        }
      }
    }

    return events;
  }

  private openSlotActionModal(
    event: CalendarEvent<AppointmentCalendarEventMeta>,
  ): void {
    this.clearMessages();
    this.selectedCalendarEvent = event;
    this.isSlotActionModalOpen = true;
  }

  private openExceptionModal(exception: AvailabilityException): void {
    this.clearMessages();
    this.editingException = exception;
    this.exceptionForm = {
      date: exception.date,
      startTime: exception.startTime,
      endTime: exception.endTime,
      type: exception.type,
      label: exception.label ?? '',
    };
    this.isExceptionModalOpen = true;
  }

  private buildExceptionEvents(): CalendarEvent<AppointmentCalendarEventMeta>[] {
    return this.availabilityExceptions.map(exception => {
      const isBlocked = exception.type === 'BLOCKED';
      const date = this.fromDateQuery(exception.date);

      return {
        start: this.buildDateTime(date, exception.startTime),
        end: this.buildDateTime(date, exception.endTime),
        title:
          exception.label ||
          this.translate(
            isBlocked
              ? 'appointments.calendar.blocked'
              : 'appointments.calendar.extraAvailable'
          ),
        color: isBlocked
          ? { primary: '#dc2626', secondary: '#fee2e2' }
          : { primary: '#0f766e', secondary: '#ccfbf1' },
        cssClass: isBlocked
          ? 'appointment-event appointment-event-blocked'
          : 'appointment-event appointment-event-extra',
        meta: {
          type: 'exception',
          exception,
        },
      };
    });
  }

  private getExceptionsForDate(date: string): AvailabilityException[] {
    return this.availabilityExceptions.filter(
      exception => exception.date === date
    );
  }

  private removeBlockedRanges(
    slot: TimeRange,
    blockedExceptions: AvailabilityException[],
  ): TimeRange[] {
    return blockedExceptions.reduce<TimeRange[]>((ranges, exception) => {
      return ranges.flatMap(range => this.splitRange(range, exception));
    }, [{ startTime: slot.startTime, endTime: slot.endTime }]);
  }

  private splitRange(
    range: TimeRange,
    blockedException: AvailabilityException,
  ): TimeRange[] {
    if (
      blockedException.startTime >= range.endTime ||
      blockedException.endTime <= range.startTime
    ) {
      return [range];
    }

    const ranges: TimeRange[] = [];

    if (blockedException.startTime > range.startTime) {
      ranges.push({
        startTime: range.startTime,
        endTime: blockedException.startTime,
      });
    }

    if (blockedException.endTime < range.endTime) {
      ranges.push({
        startTime: blockedException.endTime,
        endTime: range.endTime,
      });
    }

    return ranges;
  }

  private hasTimeOverlap(
    range: TimeRange,
    ranges: TimeRange[],
  ): boolean {
    return ranges.some(
      item => item.startTime < range.endTime && item.endTime > range.startTime
    );
  }

  private getCalendarDateRange(): { start: Date; end: Date } {
    if (this.calendarView === CalendarView.Day) {
      return {
        start: new Date(this.calendarViewDate),
        end: new Date(this.calendarViewDate),
      };
    }

    if (this.calendarView === CalendarView.Week) {
      return {
        start: startOfWeek(this.calendarViewDate, { weekStartsOn: 1 }),
        end: endOfWeek(this.calendarViewDate, { weekStartsOn: 1 }),
      };
    }

    return {
      start: startOfMonth(this.calendarViewDate),
      end: endOfMonth(this.calendarViewDate),
    };
  }

  private changeCalendarDate(step: number): Date {
    if (this.calendarView === CalendarView.Day) {
      return step > 0
        ? addDays(this.calendarViewDate, 1)
        : subDays(this.calendarViewDate, 1);
    }

    if (this.calendarView === CalendarView.Week) {
      return step > 0
        ? addWeeks(this.calendarViewDate, 1)
        : subWeeks(this.calendarViewDate, 1);
    }

    return step > 0
      ? addMonths(this.calendarViewDate, 1)
      : subMonths(this.calendarViewDate, 1);
  }

  private eachDate(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    const lastDate = new Date(end);
    lastDate.setHours(0, 0, 0, 0);

    while (current <= lastDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private buildDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);

    return result;
  }

  private fromDateQuery(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  private toDateQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private resolveSchedule(service: AppointmentServiceOption): CenterScheduleSlot[] {
    return (
      service.center?.schedule ??
      this.activeCenter?.schedule ??
      this.centers.find(center => center.id === service.center?.id)?.schedule ??
      []
    );
  }

  private toTimeValue(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  private toDateTimeInputValue(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
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
