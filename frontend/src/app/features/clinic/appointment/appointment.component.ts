import {
  Component,
  HostListener,
  Injectable,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { finalize, forkJoin, Observable, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarMonthViewBeforeRenderEvent,
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

import { CrudFilterComponent } from '../../../common-component/crud-filter/crud-filter.component';
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
  AppointmentReschedulePayload,
  AppointmentServiceOption,
  AppointmentSpecialist,
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

interface AppointmentForm {
  startDateTime: string;
  clientId: number | null;
  serviceId: number | null;
  specialistId: number | null;
  status: AppointmentStatus;
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

const STATUS_EVENT_COLORS: Record<
  AppointmentStatus,
  { primary: string; secondary: string }
> = {
  SCHEDULED: { primary: '#2e37a4', secondary: '#e6e8ff' },
  COMPLETED: { primary: '#15803d', secondary: '#dcfce7' },
  CANCELLED: { primary: '#dc2626', secondary: '#fee2e2' },
};

const CALENDAR_BOUNDARY_MARGIN_MINUTES = 60;
const CALENDAR_SEGMENT_MINUTES = 30;
const DEFAULT_CALENDAR_START_MINUTES = 6 * 60;
const DEFAULT_CALENDAR_END_MINUTES = 22 * 60;
const MINUTES_PER_DAY = 24 * 60;
const MOBILE_VIEWPORT_MAX_WIDTH = 767.98;
const AVAILABLE_SLOT_CLASS = 'appointment-slot-available';
const UNAVAILABLE_SLOT_CLASS = 'appointment-slot-unavailable';

type AppointmentViewMode = 'calendar' | 'list';
type AppointmentStatusFilter = AppointmentStatus | 'all';
type AppointmentAvailabilityFilter = 'all' | 'regular' | 'outside';

type AppointmentCalendarEventMeta =
  | { type: 'appointment'; appointment: Appointment }
  | { type: 'exception'; exception: AvailabilityException };

interface AppointmentViewState {
  viewMode: AppointmentViewMode;
  calendarView: CalendarView;
}

const APPOINTMENT_VIEW_STATE_STORAGE_KEY = 'appointments.viewState';
const APPOINTMENT_VIEW_STATE_PREFERENCE_KEY =
  'appointments.viewStatePreferenceSet';

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
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CalendarWrapperModule,
    CrudFilterComponent,
  ],
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: AppointmentCalendarDateFormatter,
    },
  ],
})
export class AppointmentComponent implements OnInit, OnDestroy {
  public readonly CalendarView = CalendarView;
  public readonly statusOptions: AppointmentStatus[] = [
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
  ];
  public appointments: Appointment[] = [];
  public filteredAppointments: Appointment[] = [];
  public calendarEvents: CalendarEvent<AppointmentCalendarEventMeta>[] = [];
  public availabilityExceptions: AvailabilityException[] = [];
  public clients: AppointmentClient[] = [];
  public services: AppointmentServiceOption[] = [];
  public specialists: AppointmentSpecialist[] = [];
  public centers: Center[] = [];
  public activeCenter: Center | null = null;
  public viewMode: AppointmentViewMode = 'list';
  public calendarView: CalendarView = CalendarView.Week;
  public calendarViewDate = new Date();
  public searchTerm = '';
  public filterDate = '';
  public filterStatus: AppointmentStatusFilter = 'all';
  public filterAvailability: AppointmentAvailabilityFilter = 'all';
  public selectedSpecialistId: number | null = null;
  public errorMessage = '';
  public successMessage = '';
  public appointmentOverlapWarning = '';
  public availableSlots: string[] = [];
  public isLoadingAvailableSlots = false;
  public availableSlotsError = '';
  public clientSearchTerm = '';
  public isClientPickerOpen = false;
  public highlightedClientIndex = 0;
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
  private clientPickerBlurTimeout?: ReturnType<typeof setTimeout>;
  private forceOutsideAvailabilityWarning = false;
  public form: AppointmentForm = this.getEmptyForm();
  public exceptionForm: AvailabilityExceptionForm = this.getEmptyExceptionForm();
  private activeCenterSubscription?: Subscription;
  private queryParamSubscription?: Subscription;
  private loadedCenterId: number | null = null;
  private unavailableSlotHintTimeout?: ReturnType<typeof setTimeout>;
  private availableSlotsRequestKey = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: AvailabilityService,
    private readonly centersService: CentersService,
    private readonly activeCenterService: ActiveCenterService,
    private readonly i18nService: I18nService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.applyStoredViewState();
    this.enforceMobileListView();
    this.queryParamSubscription = this.route.queryParamMap.subscribe(params => {
      this.applyNavigationQueryParams(params);
    });
    this.loadCenters();
    this.activeCenterSubscription = this.activeCenterService.activeCenter$.subscribe(
      center => {
        const centerId = center?.id ?? null;

        if (centerId === this.loadedCenterId) return;

        const isCenterChange = this.loadedCenterId !== null;

        this.activeCenter = center;
        this.loadedCenterId = centerId;
        if (isCenterChange) {
          this.selectedSpecialistId = null;
          this.syncNavigationStateToUrl(true);
        }
        this.loadReferenceData();
        this.loadAppointments();
        this.loadAvailabilityExceptions();
      }
    );
  }

  ngOnDestroy(): void {
    this.activeCenterSubscription?.unsubscribe();
    this.queryParamSubscription?.unsubscribe();
    this.clearUnavailableSlotHintTimeout();
    this.clearClientPickerBlurTimeout();
  }

  private applyNavigationQueryParams(params: ParamMap): void {
    const previousViewMode = this.viewMode;
    const previousCalendarView = this.calendarView;
    const previousDate = this.toDateQuery(this.calendarViewDate);
    const previousSearchTerm = this.searchTerm;
    const previousSelectedSpecialistId = this.selectedSpecialistId;
    const viewMode = params.get('view');
    const calendarView = params.get('calendarView');
    const date = params.get('date');
    const specialistId = params.get('specialistId');
    let hasViewStateQueryParam = false;

    if (viewMode === 'calendar' || viewMode === 'list') {
      this.viewMode = viewMode;
      hasViewStateQueryParam = true;
    }

    if (calendarView === CalendarView.Day) {
      this.calendarView = CalendarView.Day;
      hasViewStateQueryParam = true;
    } else if (calendarView === CalendarView.Week) {
      this.calendarView = CalendarView.Week;
      hasViewStateQueryParam = true;
    } else if (calendarView === CalendarView.Month) {
      this.calendarView = CalendarView.Month;
      hasViewStateQueryParam = true;
    }

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const parsedDate = this.fromDateQuery(date);

      if (this.toDateQuery(parsedDate) === date)
        this.calendarViewDate = parsedDate;
    }

    this.searchTerm = params.get('q') ?? '';
    this.selectedSpecialistId = this.parsePositiveNumberQueryParam(
      specialistId,
    );

    this.enforceMobileListView();

    if (
      hasViewStateQueryParam &&
      !this.isMobileViewport() &&
      this.hasStoredViewStatePreference()
    )
      this.persistViewState();

    const calendarChanged =
      previousCalendarView !== this.calendarView ||
      previousDate !== this.toDateQuery(this.calendarViewDate);
    const filtersChanged =
      previousSearchTerm !== this.searchTerm ||
      previousSelectedSpecialistId !== this.selectedSpecialistId;

    if (filtersChanged) {
      this.applySearch();
      this.updateCalendarEvents();
    }

    if (calendarChanged) {
      this.clearCalendarSlotHint();
      this.loadAvailabilityExceptions(false);
    }

    if (previousViewMode !== this.viewMode)
      this.clearCalendarSlotHint();
  }

  private applyStoredViewState(): void {
    if (!this.hasStoredViewStatePreference()) return;

    const storedState = this.getStoredViewState();

    if (!storedState) return;

    this.viewMode = storedState.viewMode;
    this.calendarView = storedState.calendarView;
  }

  private getStoredViewState(): AppointmentViewState | null {
    if (typeof window === 'undefined') return null;

    try {
      const value = window.localStorage.getItem(
        APPOINTMENT_VIEW_STATE_STORAGE_KEY,
      );
      if (!value) return null;

      const parsedValue = JSON.parse(value) as Partial<AppointmentViewState>;

      if (
        !this.isAppointmentViewMode(parsedValue.viewMode) ||
        !this.isAppointmentCalendarView(parsedValue.calendarView)
      )
        return null;

      return {
        viewMode: parsedValue.viewMode,
        calendarView: parsedValue.calendarView,
      };
    } catch {
      return null;
    }
  }

  private persistViewState(): void {
    if (typeof window === 'undefined') return;

    const state: AppointmentViewState = {
      viewMode: this.viewMode,
      calendarView: this.calendarView,
    };

    window.localStorage.setItem(
      APPOINTMENT_VIEW_STATE_STORAGE_KEY,
      JSON.stringify(state),
    );
  }

  private rememberViewStatePreference(): void {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(APPOINTMENT_VIEW_STATE_PREFERENCE_KEY, 'true');
  }

  private hasStoredViewStatePreference(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.localStorage.getItem(APPOINTMENT_VIEW_STATE_PREFERENCE_KEY) ===
        'true'
    );
  }

  private isAppointmentViewMode(
    value: unknown,
  ): value is AppointmentViewMode {
    return value === 'calendar' || value === 'list';
  }

  private isAppointmentCalendarView(value: unknown): value is CalendarView {
    return (
      value === CalendarView.Day ||
      value === CalendarView.Week ||
      value === CalendarView.Month
    );
  }

  private enforceMobileListView(): void {
    if (!this.isMobileViewport() || this.viewMode === 'list') return;

    this.viewMode = 'list';
    this.clearCalendarSlotHint();
  }

  private isMobileViewport(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.innerWidth <= MOBILE_VIEWPORT_MAX_WIDTH
    );
  }

  private syncNavigationStateToUrl(replaceUrl = false): void {
    const searchTerm = this.searchTerm.trim();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        view: this.viewMode,
        calendarView: this.calendarView,
        date: this.toDateQuery(this.calendarViewDate),
        specialistId: this.selectedSpecialistId
          ? String(this.selectedSpecialistId)
          : null,
        q: searchTerm || null,
      },
      replaceUrl,
    });
  }

  private parsePositiveNumberQueryParam(value: string | null): number | null {
    if (!value) return null;

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) return null;

    return parsedValue;
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
    this.resetClientPicker();
    this.resetAvailableSlots();
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
    this.resetClientPicker();
    this.resetAvailableSlots();
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
      specialistId: appointment.specialist.id,
      status: appointment.status,
    };
    this.resetClientPicker();
    this.loadAvailableSlots();
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
    this.forceOutsideAvailabilityWarning = false;
    this.closeClientPicker();
    this.resetAvailableSlots();
  }

  public saveAppointment(): void {
    if (!this.isFormComplete()) {
      this.errorMessage = this.translate('appointments.errors.form');
      return;
    }

    this.clearMessages();

    const payload = this.getPayload();
    const request = this.getAppointmentSaveRequest(payload);

    if (!request) return;

    this.isSaving = true;

    request
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.successMessage = this.editingAppointment
            ? this.translate('appointments.success.updated')
            : this.translate('appointments.success.created');
          this.clearCalendarSlotHint();
          this.isFormModalOpen = false;
          this.loadAppointments(false);
        },
        error: (error: unknown) => {
          this.handleAppointmentActionError(error, 'appointments.errors.save');
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

  @HostListener('window:resize')
  public keepMobileListView(): void {
    this.enforceMobileListView();
  }

  public deleteAppointment(): void {
    if (!this.appointmentToDelete) return;

    this.isDeleting = true;
    this.clearMessages();

    this.appointmentsService
      .cancel(this.appointmentToDelete.id)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.successMessage = this.translate('appointments.success.deleted');
          this.isDeleteModalOpen = false;
          this.appointmentToDelete = null;
          this.loadAppointments(false);
        },
        error: (error: unknown) => {
          this.handleAppointmentActionError(error, 'appointments.errors.delete');
        },
      });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();
    const appointments = this.getSpecialistFilteredAppointments();

    this.filteredAppointments = appointments.filter(appointment => {
      const matchesSearch =
        !search || this.getSearchText(appointment).includes(search);
      const matchesStatus =
        this.filterStatus === 'all' ||
        appointment.status === this.filterStatus;
      const matchesAvailability =
        this.filterAvailability === 'all' ||
        (this.filterAvailability === 'regular' &&
          !appointment.outsideAvailability) ||
        (this.filterAvailability === 'outside' &&
          appointment.outsideAvailability);
      const matchesDate =
        !this.filterDate ||
        this.toDateQuery(new Date(appointment.startDateTime)) ===
          this.filterDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAvailability &&
        matchesDate
      );
    });
  }

  public handleSearchChange(): void {
    this.applySearch();
    this.updateCalendarEvents();
    this.syncNavigationStateToUrl(true);
  }

  public applySpecialistFilter(): void {
    this.applySearch();
    this.updateCalendarEvents();
    this.syncNavigationStateToUrl();
  }

  public applyAppointmentFilters(): void {
    this.applySearch();
    this.updateCalendarEvents();
  }

  public clearFilters(): void {
    this.filterDate = '';
    this.filterStatus = 'all';
    this.filterAvailability = 'all';
    this.applyAppointmentFilters();
  }

  public statusBadgeClass(status: AppointmentStatus): string {
    return STATUS_BADGE_CLASSES[status];
  }

  public trackByAppointmentId(_: number, appointment: Appointment): number {
    return appointment.id;
  }

  public get appointmentTableColumnCount(): number {
    return 6;
  }

  public setViewMode(viewMode: AppointmentViewMode): void {
    this.viewMode = viewMode;
    this.rememberViewStatePreference();
    this.persistViewState();
    this.syncNavigationStateToUrl();

    if (viewMode === 'calendar')
      this.loadAvailabilityExceptions(false);
  }

  public setCalendarView(view: CalendarView): void {
    this.calendarView = view;
    this.rememberViewStatePreference();
    this.persistViewState();
    this.clearCalendarSlotHint();
    this.loadAvailabilityExceptions(false);
    this.syncNavigationStateToUrl();
  }

  public openCalendarDayFromMonth(date: Date): void {
    this.calendarViewDate = date;
    this.setCalendarView(CalendarView.Day);
  }

  public goToToday(): void {
    this.calendarViewDate = new Date();
    this.clearCalendarSlotHint();
    this.loadAvailabilityExceptions(false);
    this.syncNavigationStateToUrl();
  }

  public goToPreviousPeriod(): void {
    this.calendarViewDate = this.changeCalendarDate(-1);
    this.clearCalendarSlotHint();
    this.loadAvailabilityExceptions(false);
    this.syncNavigationStateToUrl();
  }

  public goToNextPeriod(): void {
    this.calendarViewDate = this.changeCalendarDate(1);
    this.clearCalendarSlotHint();
    this.loadAvailabilityExceptions(false);
    this.syncNavigationStateToUrl();
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

  public clearAppointmentOverlapWarning(): void {
    this.appointmentOverlapWarning = '';
  }

  public handleDateTimeChange(): void {
    this.clearOutsideAvailabilityWarningHint();
    this.clearAppointmentOverlapWarning();
    this.loadAvailableSlots();
  }

  public handleSpecialistChange(): void {
    this.clearAppointmentOverlapWarning();
    this.loadAvailableSlots();
  }

  public selectAvailableSlot(slot: string): void {
    const date = this.getFormDate();

    if (!date) return;

    this.form.startDateTime = `${date}T${slot}`;
    this.clearOutsideAvailabilityWarningHint();
    this.clearAppointmentOverlapWarning();
  }

  public trackByAvailableSlot(_: number, slot: string): string {
    return slot;
  }

  public get canLoadAvailableSlots(): boolean {
    return (
      !!this.getFormDate() &&
      !!this.form.serviceId &&
      !!this.form.specialistId
    );
  }

  public isSelectedAvailableSlot(slot: string): boolean {
    return this.getFormTime() === slot;
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

  public markMonthDays(event: CalendarMonthViewBeforeRenderEvent): void {
    event.body.forEach(day => {
      const dateKey = this.toDateQuery(day.date);
      const cssClasses = [
        day.cssClass,
        this.hasBlockedExceptionOnDate(dateKey)
          ? 'appointments-month-day-blocked'
          : '',
      ];

      day.cssClass = cssClasses.filter(Boolean).join(' ');
    });
  }

  public monthAppointmentCount(date: Date): number {
    const dateKey = this.toDateQuery(date);

    return this.filteredAppointments.filter(
      appointment =>
        this.toDateQuery(new Date(appointment.startDateTime)) === dateKey
    ).length;
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

  public get filteredClientOptions(): AppointmentClient[] {
    const term = this.normalizeSearchValue(this.clientSearchTerm);

    if (!term) return this.clientOptions;

    return this.clientOptions.filter(client =>
      this.normalizeSearchValue(this.clientOptionLabel(client)).includes(term)
    );
  }

  public get serviceOptions(): AppointmentServiceOption[] {
    return this.withCurrentOption(this.services, this.editingAppointment?.service);
  }

  public get specialistOptions(): AppointmentSpecialist[] {
    const service = this.selectedService;

    if (service?.specialist?.id) {
      const specialists = this.specialists.filter(
        specialist => specialist.id === service.specialist?.id
      );

      return this.withCurrentOption(specialists, service.specialist);
    }

    return this.withCurrentOption(
      this.specialists,
      this.editingAppointment?.specialist
    );
  }

  public clientOptionLabel(client: AppointmentClient): string {
    const status = client.active
      ? ''
      : ` (${this.translate('common.inactive').toLowerCase()})`;
    const priority = ` · ${this.translate('clients.fields.priority')}: ${client.priority}`;

    return `${client.name} - ${client.phone}${priority}${status}`;
  }

  public openClientPicker(): void {
    this.clearClientPickerBlurTimeout();
    this.isClientPickerOpen = true;
    this.highlightedClientIndex = this.getSelectedClientIndex();
  }

  public handleClientSearchChange(value: string): void {
    this.clientSearchTerm = value;
    this.form.clientId = null;
    this.isClientPickerOpen = true;
    this.highlightedClientIndex = 0;
  }

  public handleClientSearchKeydown(event: KeyboardEvent): void {
    const options = this.filteredClientOptions;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isClientPickerOpen = true;
      this.highlightedClientIndex = options.length
        ? Math.min(this.highlightedClientIndex + 1, options.length - 1)
        : 0;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.isClientPickerOpen = true;
      this.highlightedClientIndex = Math.max(this.highlightedClientIndex - 1, 0);
      return;
    }

    if (event.key === 'Enter' && this.isClientPickerOpen && options.length) {
      event.preventDefault();
      this.selectClientOption(options[this.highlightedClientIndex] ?? options[0]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeClientPicker();
      this.syncClientSearchTerm();
    }
  }

  public scheduleCloseClientPicker(): void {
    this.clearClientPickerBlurTimeout();
    this.clientPickerBlurTimeout = setTimeout(() => {
      this.closeClientPicker();
      this.syncClientSearchTerm();
    }, 150);
  }

  public selectClientOption(client: AppointmentClient): void {
    this.form.clientId = client.id;
    this.clientSearchTerm = this.clientOptionLabel(client);
    this.closeClientPicker();
  }

  public isClientOptionHighlighted(index: number): boolean {
    return index === this.highlightedClientIndex;
  }

  public serviceOptionLabel(service: AppointmentServiceOption): string {
    const status = service.active
      ? ''
      : ` (${this.translate('common.inactive').toLowerCase()})`;
    const specialist = service.specialist?.name
      ? ` - ${service.specialist.name}`
      : '';

    return `${service.name}${specialist} (${service.durationMinutes} min)${status}`;
  }

  public specialistOptionLabel(specialist: AppointmentSpecialist): string {
    const status =
      specialist.status === 'ACTIVE'
        ? ''
        : ` (${this.translate('common.inactive').toLowerCase()})`;
    const specialty = specialist.specialty ? ` - ${specialist.specialty}` : '';

    return `${specialist.name}${specialty}${status}`;
  }

  public handleServiceChange(): void {
    this.clearOutsideAvailabilityWarningHint();
    this.clearAppointmentOverlapWarning();

    const service = this.selectedService;

    if (service?.specialist?.id) {
      this.form.specialistId = service.specialist.id;
      this.loadAvailableSlots();
      return;
    }

    this.form.specialistId = null;
    this.loadAvailableSlots();
  }

  private loadAvailableSlots(): void {
    const date = this.getFormDate();
    const serviceId = Number(this.form.serviceId);
    const specialistId = Number(this.form.specialistId);

    this.availableSlotsError = '';

    if (!date || !serviceId || !specialistId) {
      this.resetAvailableSlots();
      return;
    }

    const requestKey = `${date}|${serviceId}|${specialistId}`;
    this.availableSlotsRequestKey = requestKey;
    this.isLoadingAvailableSlots = true;

    this.appointmentsService
      .getAvailableSlots(date, serviceId, specialistId)
      .pipe(
        finalize(() => {
          if (this.availableSlotsRequestKey === requestKey)
            this.isLoadingAvailableSlots = false;
        })
      )
      .subscribe({
        next: slots => {
          if (this.availableSlotsRequestKey !== requestKey) return;

          this.availableSlots = this.withCurrentAppointmentSlot(slots, date);
        },
        error: (error: unknown) => {
          if (this.availableSlotsRequestKey !== requestKey) return;

          const message = this.getApiErrorMessage(
            error,
            'appointments.errors.slots',
          );

          this.availableSlots = [];
          this.availableSlotsError = message;
          this.toastr.error(message);
        },
      });
  }

  private resetAvailableSlots(): void {
    this.availableSlots = [];
    this.availableSlotsError = '';
    this.isLoadingAvailableSlots = false;
    this.availableSlotsRequestKey = '';
  }

  private withCurrentAppointmentSlot(slots: string[], date: string): string[] {
    if (!this.editingAppointment) return slots;

    const currentStart = new Date(this.editingAppointment.startDateTime);
    const currentDate = this.toDateQuery(currentStart);
    const currentTime = this.toTimeValue(currentStart);

    if (date !== currentDate || this.getFormTime() !== currentTime)
      return slots;

    if (slots.includes(currentTime)) return slots;

    return [...slots, currentTime].sort();
  }

  private get selectedService(): AppointmentServiceOption | null {
    if (!this.form.serviceId) return null;

    return (
      this.serviceOptions.find(
        service => service.id === Number(this.form.serviceId)
      ) ?? null
    );
  }

  public get selectedSpecialist(): AppointmentSpecialist | null {
    if (!this.selectedSpecialistId) return null;

    return (
      this.specialists.find(
        specialist => specialist.id === this.selectedSpecialistId
      ) ?? null
    );
  }

  public selectedSpecialistInitials(): string {
    const specialist = this.selectedSpecialist;

    if (!specialist) return '';

    return specialist.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  public statusLabel(status: AppointmentStatus): string {
    return this.translate(`appointments.status.${status.toLowerCase()}`);
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
      specialists: this.appointmentsService.getSpecialists(this.activeCenter?.id),
    }).subscribe({
      next: ({ clients, services, specialists }) => {
        this.clients = clients;
        this.services = services;
        this.specialists = specialists;
        this.ensureSelectedSpecialistIsAvailable();
        this.applySearch();
        this.updateCalendarEvents();
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
      specialistId: Number(this.form.specialistId),
      allowOutsideAvailability: this.isOutsideFixedSchedule(),
      ...(this.editingAppointment ? { status: this.form.status } : {}),
    };
  }

  private getAppointmentSaveRequest(
    payload: AppointmentPayload,
  ): Observable<Appointment> | null {
    if (!this.editingAppointment)
      return this.appointmentsService.createAppointment(payload);

    const appointment = this.editingAppointment;
    const statusChanged = payload.status !== appointment.status;
    const startChanged = this.hasAppointmentStartChanged(appointment, payload);
    const detailsChanged = this.hasAppointmentDetailsChanged(
      appointment,
      payload,
    );

    if (statusChanged && (startChanged || detailsChanged)) {
      this.showAppointmentError('appointments.errors.mixedStatusEdit');
      return null;
    }

    if (statusChanged)
      return this.getStatusChangeRequest(appointment.id, payload.status);

    if (startChanged && detailsChanged) {
      this.showAppointmentError('appointments.errors.mixedRescheduleEdit');
      return null;
    }

    if (startChanged)
      return this.appointmentsService.reschedule(
        appointment.id,
        this.getReschedulePayload(payload),
      );

    return this.appointmentsService.updateAppointment(
      appointment.id,
      this.getAppointmentDataPayload(payload),
    );
  }

  private getStatusChangeRequest(
    id: number,
    status?: AppointmentStatus,
  ): Observable<Appointment> | null {
    if (status === 'CANCELLED') return this.appointmentsService.cancel(id);

    if (status === 'COMPLETED') return this.appointmentsService.complete(id);

    this.showAppointmentError('appointments.errors.unsupportedStatusChange');
    return null;
  }

  private hasAppointmentStartChanged(
    appointment: Appointment,
    payload: AppointmentPayload,
  ): boolean {
    return (
      new Date(payload.startDateTime).getTime() !==
      new Date(appointment.startDateTime).getTime()
    );
  }

  private hasAppointmentDetailsChanged(
    appointment: Appointment,
    payload: AppointmentPayload,
  ): boolean {
    return (
      payload.clientId !== appointment.client.id ||
      payload.serviceId !== appointment.service.id ||
      payload.specialistId !== appointment.specialist.id
    );
  }

  private getAppointmentDataPayload(
    payload: AppointmentPayload,
  ): AppointmentPayload {
    return {
      startDateTime: payload.startDateTime,
      clientId: payload.clientId,
      serviceId: payload.serviceId,
      specialistId: payload.specialistId,
      allowOutsideAvailability: payload.allowOutsideAvailability,
    };
  }

  private getReschedulePayload(
    payload: AppointmentPayload,
  ): AppointmentReschedulePayload {
    return {
      startDateTime: payload.startDateTime,
      allowOutsideAvailability: payload.allowOutsideAvailability,
    };
  }

  private isFormComplete(): boolean {
    return (
      !!this.form.clientId &&
      !!this.form.serviceId &&
      !!this.form.specialistId &&
      !!this.form.startDateTime &&
      this.isSelectedServiceSpecialistValid()
    );
  }

  private getSearchText(appointment: Appointment): string {
    return [
      appointment.id,
      appointment.client.name,
      appointment.client.phone,
      appointment.service.name,
      appointment.specialist.name,
      this.statusLabel(appointment.status),
      appointment.outsideAvailability
        ? this.translate('appointments.outsideAvailability.badge')
        : '',
      appointment.startDateTime,
    ]
      .join(' ')
      .toLowerCase();
  }

  private resetClientPicker(): void {
    this.closeClientPicker();
    this.syncClientSearchTerm();
    this.highlightedClientIndex = 0;
  }

  private closeClientPicker(): void {
    this.clearClientPickerBlurTimeout();
    this.isClientPickerOpen = false;
  }

  private syncClientSearchTerm(): void {
    const selectedClient = this.clientOptions.find(
      client => client.id === this.form.clientId
    );

    this.clientSearchTerm = selectedClient
      ? this.clientOptionLabel(selectedClient)
      : '';
  }

  private getSelectedClientIndex(): number {
    const selectedIndex = this.filteredClientOptions.findIndex(
      client => client.id === this.form.clientId
    );

    return selectedIndex >= 0 ? selectedIndex : 0;
  }

  private clearClientPickerBlurTimeout(): void {
    if (!this.clientPickerBlurTimeout) return;

    clearTimeout(this.clientPickerBlurTimeout);
    this.clientPickerBlurTimeout = undefined;
  }

  private normalizeSearchValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private getEmptyForm(): AppointmentForm {
    return {
      startDateTime: '',
      clientId: null,
      serviceId: null,
      specialistId: null,
      status: 'SCHEDULED',
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

  private getSpecialistFilteredAppointments(): Appointment[] {
    if (!this.selectedSpecialistId) return [...this.appointments];

    return this.appointments.filter(
      appointment => appointment.specialist.id === this.selectedSpecialistId
    );
  }

  private ensureSelectedSpecialistIsAvailable(): void {
    if (
      this.selectedSpecialistId &&
      !this.specialists.some(
        specialist => specialist.id === this.selectedSpecialistId
      )
    ) {
      this.selectedSpecialistId = null;
      this.syncNavigationStateToUrl(true);
    }
  }

  private isSelectedServiceSpecialistValid(): boolean {
    const service = this.selectedService;

    if (!service?.specialist?.id) return true;

    return service.specialist.id === Number(this.form.specialistId);
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
    return this.filteredAppointments.map(appointment => {
      const start = new Date(appointment.startDateTime);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + appointment.duration);

      return {
        start,
        end,
        title: `${appointment.client.name} - ${appointment.service.name} - ${appointment.specialist.name}`,
        color: STATUS_EVENT_COLORS[appointment.status],
        cssClass: this.appointmentEventClass(appointment),
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

  private hasBlockedExceptionOnDate(date: string): boolean {
    return this.availabilityExceptions.some(
      exception => exception.date === date && exception.type === 'BLOCKED'
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

  private appointmentEventClass(appointment: Appointment): string {
    const classes = [
      'appointment-event',
      `appointment-event-${appointment.status.toLowerCase()}`,
    ];

    if (appointment.outsideAvailability)
      classes.push('appointment-event-outside');

    return classes.join(' ');
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

  private getFormDate(): string {
    return this.form.startDateTime.split('T')[0] ?? '';
  }

  private getFormTime(): string {
    return this.form.startDateTime.split('T')[1]?.slice(0, 5) ?? '';
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
    this.appointmentOverlapWarning = '';
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

  private handleAppointmentActionError(
    error: unknown,
    fallbackKey: string,
  ): void {
    const message = this.getApiErrorMessage(error, fallbackKey);

    this.errorMessage = message;

    if (error instanceof HttpErrorResponse && error.status === 409)
      this.appointmentOverlapWarning = message;

    this.toastr.error(message);
  }

  private showAppointmentError(key: string): void {
    const message = this.translate(key);

    this.errorMessage = message;
    this.toastr.error(message);
  }

  private getApiErrorMessage(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse))
      return this.translate(fallbackKey);

    const apiMessage = this.extractApiErrorMessage(
      error.error?.message ?? error.error,
    );

    return apiMessage || this.translate(fallbackKey);
  }

  private extractApiErrorMessage(message: unknown): string {
    if (typeof message === 'string') return message;

    if (Array.isArray(message)) {
      const firstMessage = message.find(item => typeof item === 'string');

      return firstMessage ?? '';
    }

    return '';
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
