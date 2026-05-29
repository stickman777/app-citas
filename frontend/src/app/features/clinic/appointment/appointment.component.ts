import {
  Component,
  HostListener,
  Injectable,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, Subscription } from 'rxjs';
import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarWeekViewBeforeRenderEvent,
  CalendarView,
  DateFormatterParams,
} from 'angular-calendar';
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

const CALENDAR_BOUNDARY_MARGIN_MINUTES = 60;
const CALENDAR_SEGMENT_MINUTES = 30;
const DEFAULT_CALENDAR_START_MINUTES = 6 * 60;
const DEFAULT_CALENDAR_END_MINUTES = 22 * 60;
const MINUTES_PER_DAY = 24 * 60;
const AVAILABLE_SLOT_CLASS = 'appointment-slot-available';
const UNAVAILABLE_SLOT_CLASS = 'appointment-slot-unavailable';

type AppointmentViewMode = 'calendar' | 'list';

type AppointmentCalendarEventMeta =
  | { type: 'appointment'; appointment: Appointment }
  | { type: 'exception'; exception: AvailabilityException };

@Injectable()
class AppointmentCalendarDateFormatter extends CalendarDateFormatter {
  public override weekViewHour({ date, locale }: DateFormatterParams): string {
    return formatDate(date, 'HH:mm', locale ?? 'es');
  }

  public override dayViewHour({ date, locale }: DateFormatterParams): string {
    return formatDate(date, 'HH:mm', locale ?? 'es');
  }

  public override monthViewColumnHeader(params: DateFormatterParams): string {
    return capitalizeFirstLetter(super.monthViewColumnHeader(params));
  }

  public override weekViewColumnHeader(params: DateFormatterParams): string {
    return capitalizeFirstLetter(super.weekViewColumnHeader(params));
  }

  public override weekViewColumnSubHeader({
    date,
    locale,
  }: DateFormatterParams): string {
    const safeLocale = locale ?? 'es';

    return `${formatDate(date, 'd', safeLocale)} ${capitalizeFirstLetter(
      formatDate(date, 'MMM', safeLocale)
    )}`;
  }
}

function capitalizeFirstLetter(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe, CalendarWrapperModule],
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: AppointmentCalendarDateFormatter,
    },
  ],
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
  public isExceptionModalOpen = false;
  public showUnavailableSlotHint = false;
  public unavailableSlotHintLeft = 0;
  public unavailableSlotHintTop = 0;
  public editingAppointment: Appointment | null = null;
  public appointmentToDelete: Appointment | null = null;
  public editingException: AvailabilityException | null = null;
  private forceOutsideAvailabilityWarning = false;
  public form: AppointmentForm = this.getEmptyForm();
  public exceptionForm: AvailabilityExceptionForm = this.getEmptyExceptionForm();
  private activeCenterSubscription?: Subscription;
  private loadedCenterId: number | null = null;
  private unavailableSlotHintTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: AvailabilityService,
    private readonly centersService: CentersService,
    private readonly authService: AuthService,
    private readonly activeCenterService: ActiveCenterService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.applyCalendarQueryParams();
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
    this.clearUnavailableSlotHintTimeout();
  }

  private applyCalendarQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const viewMode = params.get('view');
    const calendarView = params.get('calendarView');
    const date = params.get('date');

    if (viewMode === 'calendar' || viewMode === 'list')
      this.viewMode = viewMode;

    if (calendarView === CalendarView.Day)
      this.calendarView = CalendarView.Day;
    else if (calendarView === CalendarView.Week)
      this.calendarView = CalendarView.Week;
    else if (calendarView === CalendarView.Month)
      this.calendarView = CalendarView.Month;

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const parsedDate = this.fromDateQuery(date);

      if (this.toDateQuery(parsedDate) === date)
        this.calendarViewDate = parsedDate;
    }
  }

  public loadAppointments(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages)
      this.clearMessages();

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
    this.clearCalendarSlotHint();
    this.editingAppointment = null;
    this.forceOutsideAvailabilityWarning = false;
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public openCreateModalFromCalendarSegment(
    date: Date,
    forceOutsideWarning = false,
  ): void {
    this.clearMessages();
    this.clearCalendarSlotHint();
    this.editingAppointment = null;
    this.forceOutsideAvailabilityWarning = forceOutsideWarning;
    this.form = {
      ...this.getEmptyForm(),
      startDateTime: this.toDateTimeInputValue(date),
    };
    this.isFormModalOpen = true;
  }

  public openEditModal(appointment: Appointment): void {
    this.clearMessages();
    this.clearCalendarSlotHint();
    this.editingAppointment = appointment;
    this.forceOutsideAvailabilityWarning = false;
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
    this.forceOutsideAvailabilityWarning = false;
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

  public closeExceptionModal(): void {
    if (this.isSavingException || this.isDeletingException) return;

    this.isExceptionModalOpen = false;
    this.editingException = null;
  }

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isDeleteModalOpen) this.closeDeleteModal();
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

    if (viewMode === 'calendar')
      this.loadAvailabilityExceptions(false);
  }

  public setCalendarView(view: CalendarView): void {
    this.calendarView = view;
    this.clearCalendarSlotHint();
    this.loadAvailabilityExceptions(false);
  }

  public goToToday(): void {
    this.calendarViewDate = new Date();
    this.clearCalendarSlotHint();
    this.loadAvailabilityExceptions(false);
  }

  public goToPreviousPeriod(): void {
    this.calendarViewDate = this.changeCalendarDate(-1);
    this.clearCalendarSlotHint();
    this.loadAvailabilityExceptions(false);
  }

  public goToNextPeriod(): void {
    this.calendarViewDate = this.changeCalendarDate(1);
    this.clearCalendarSlotHint();
    this.loadAvailabilityExceptions(false);
  }

  public handleCalendarSegmentClick(
    date: Date,
    sourceEvent?: MouseEvent,
  ): void {
    if (this.isCalendarSegmentAvailable(date)) {
      this.openCreateModalFromCalendarSegment(date);
      return;
    }

    if ((sourceEvent?.detail ?? 1) >= 2) {
      this.openCreateModalFromCalendarSegment(date, true);
      return;
    }

    this.showCalendarSlotHint(sourceEvent);
  }

  @HostListener('document:mousemove')
  public scheduleUnavailableSlotHintDismiss(): void {
    if (!this.showUnavailableSlotHint || this.unavailableSlotHintTimeout)
      return;

    this.unavailableSlotHintTimeout = setTimeout(() => {
      this.clearCalendarSlotHint();
    }, 800);
  }

  public handleCalendarEvent(
    event: CalendarEvent<AppointmentCalendarEventMeta>,
    sourceEvent?: MouseEvent | KeyboardEvent,
  ): void {
    sourceEvent?.stopPropagation();

    if (event.meta?.type === 'appointment') {
      this.openEditModal(event.meta.appointment);
      return;
    }

    if (event.meta?.type === 'exception') {
      this.openExceptionModal(event.meta.exception);
      return;
    }
  }

  public markCalendarAvailability(
    event: CalendarWeekViewBeforeRenderEvent,
  ): void {
    event.hourColumns.forEach(column => {
      column.hours.forEach(hour => {
        hour.segments.forEach(segment => {
          segment.cssClass = this.resolveSegmentCssClass(
            segment.cssClass,
            this.isCalendarSegmentAvailable(segment.date)
          );
        });
      });
    });
  }

  public get calendarStartHour(): number {
    return Math.floor(this.getCalendarScheduleBounds().startMinutes / 60);
  }

  public get calendarStartMinute(): number {
    return this.getCalendarScheduleBounds().startMinutes % 60;
  }

  public get calendarEndHour(): number {
    return Math.floor(this.getCalendarScheduleBounds().endMinutes / 60);
  }

  public get calendarEndMinute(): number {
    return this.getCalendarScheduleBounds().endMinutes % 60;
  }

  public get calendarLocale(): string {
    return this.i18nService.currentLanguage === 'es' ? 'es' : 'en-US';
  }

  public calendarFullDateLabel(date: Date): string {
    const weekday = capitalizeFirstLetter(
      new Intl.DateTimeFormat(this.calendarLocale, { weekday: 'long' }).format(date)
    );
    const day = new Intl.DateTimeFormat(this.calendarLocale, {
      day: 'numeric',
    }).format(date);
    const month = capitalizeFirstLetter(
      new Intl.DateTimeFormat(this.calendarLocale, { month: 'long' }).format(date)
    );

    return this.i18nService.currentLanguage === 'es'
      ? `${weekday} ${day} de ${month}`
      : `${weekday}, ${month} ${day}`;
  }

  public isOutsideAvailabilityWarningVisible(): boolean {
    return this.forceOutsideAvailabilityWarning || this.isOutsideFixedSchedule();
  }

  public clearOutsideAvailabilityWarningHint(): void {
    this.forceOutsideAvailabilityWarning = false;
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
      allowOutsideAvailability: this.isOutsideFixedSchedule(),
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

    if (clearMessages)
      this.clearMessages();

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

  private hasTimeOverlap(
    range: TimeRange,
    ranges: TimeRange[],
  ): boolean {
    return ranges.some(
      item => item.startTime < range.endTime && item.endTime > range.startTime
    );
  }

  private isCalendarSegmentAvailable(date: Date): boolean {
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + CALENDAR_SEGMENT_MINUTES);

    const startTime = this.toTimeValue(date);
    const endTime = this.toTimeValue(endDate);
    const dateQuery = this.toDateQuery(date);
    const exceptions = this.getExceptionsForDate(dateQuery);
    const blockedRanges = exceptions
      .filter(exception => exception.type === 'BLOCKED')
      .map(exception => ({
        startTime: exception.startTime,
        endTime: exception.endTime,
      }));

    if (this.hasTimeOverlap({ startTime, endTime }, blockedRanges))
      return false;

    const scheduleRanges = (this.activeCenter?.schedule ?? [])
      .filter(slot => slot.dayOfWeek === date.getDay())
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

    return [...scheduleRanges, ...extraRanges].some(range => {
      return startTime >= range.startTime && endTime <= range.endTime;
    });
  }

  private resolveSegmentCssClass(
    currentClass: string | undefined,
    isAvailable: boolean,
  ): string {
    const classes = (currentClass ?? '')
      .split(' ')
      .filter(
        className =>
          className &&
          className !== AVAILABLE_SLOT_CLASS &&
          className !== UNAVAILABLE_SLOT_CLASS
      );

    classes.push(isAvailable ? AVAILABLE_SLOT_CLASS : UNAVAILABLE_SLOT_CLASS);

    return classes.join(' ');
  }

  private getCalendarScheduleBounds(): {
    startMinutes: number;
    endMinutes: number;
  } {
    const slots = this.activeCenter?.schedule ?? [];

    if (slots.length === 0)
      return {
        startMinutes: DEFAULT_CALENDAR_START_MINUTES,
        endMinutes: DEFAULT_CALENDAR_END_MINUTES,
      };

    const firstStart = Math.min(
      ...slots.map(slot => this.timeToMinutes(slot.startTime))
    );
    const lastEnd = Math.max(
      ...slots.map(slot => this.timeToMinutes(slot.endTime))
    );
    const startMinutes = this.floorToHalfHour(
      firstStart - CALENDAR_BOUNDARY_MARGIN_MINUTES
    );
    const endMinutes = this.ceilToHalfHour(
      lastEnd + CALENDAR_BOUNDARY_MARGIN_MINUTES
    );

    return {
      startMinutes: Math.max(0, startMinutes),
      endMinutes: Math.min(MINUTES_PER_DAY - 1, endMinutes),
    };
  }

  private getCalendarDateRange(): { start: Date; end: Date } {
    if (this.calendarView === CalendarView.Day)
      return {
        start: new Date(this.calendarViewDate),
        end: new Date(this.calendarViewDate),
      };

    if (this.calendarView === CalendarView.Week)
      return {
        start: startOfWeek(this.calendarViewDate, { weekStartsOn: 1 }),
        end: endOfWeek(this.calendarViewDate, { weekStartsOn: 1 }),
      };

    return {
      start: startOfMonth(this.calendarViewDate),
      end: endOfMonth(this.calendarViewDate),
    };
  }

  private changeCalendarDate(step: number): Date {
    if (this.calendarView === CalendarView.Day)
      return step > 0
        ? addDays(this.calendarViewDate, 1)
        : subDays(this.calendarViewDate, 1);

    if (this.calendarView === CalendarView.Week)
      return step > 0
        ? addWeeks(this.calendarViewDate, 1)
        : subWeeks(this.calendarViewDate, 1);

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

  private timeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private floorToHalfHour(minutes: number): number {
    return Math.floor(minutes / 30) * 30;
  }

  private ceilToHalfHour(minutes: number): number {
    return Math.ceil(minutes / 30) * 30;
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
    if (!current || options.some(option => option.id === current.id))
      return options;

    return [current, ...options];
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private clearCalendarSlotHint(): void {
    this.clearUnavailableSlotHintTimeout();
    this.showUnavailableSlotHint = false;
  }

  private showCalendarSlotHint(sourceEvent?: MouseEvent): void {
    this.clearUnavailableSlotHintTimeout();
    this.unavailableSlotHintLeft = sourceEvent
      ? Math.min(sourceEvent.clientX + 12, window.innerWidth - 340)
      : 24;
    this.unavailableSlotHintTop = sourceEvent
      ? Math.min(sourceEvent.clientY + 12, window.innerHeight - 80)
      : 24;
    this.showUnavailableSlotHint = true;
  }

  private clearUnavailableSlotHintTimeout(): void {
    if (!this.unavailableSlotHintTimeout) return;

    clearTimeout(this.unavailableSlotHintTimeout);
    this.unavailableSlotHintTimeout = undefined;
  }

  private translate(key: string): string {
    return this.i18nService.translate(key);
  }
}
