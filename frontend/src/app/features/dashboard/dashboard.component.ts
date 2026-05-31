import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { PrimeNG } from 'primeng/config';
import {
  DatePickerMonthChangeEvent,
  DatePickerYearChangeEvent,
} from 'primeng/types/datepicker';
import { finalize, forkJoin, Subscription } from 'rxjs';

import {
  Appointment,
  AppointmentsService,
} from '../../core/appointments/appointments.service';
import { AvailabilityService } from '../../core/availability/availability.service';
import { ActiveCenterService } from '../../core/centers/active-center.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  Specialist,
  SpecialistStatus,
  SpecialistsService,
} from '../../core/specialists/specialists.service';
import {
  Service,
  ServicesService,
} from '../../core/services/services.service';
import { routes } from '../../shared/routes/routes';

interface DashboardCalendarDate {
  day: number;
  month: number;
  year: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, RouterLink, DatePickerModule, FormsModule, TranslatePipe],
})
export class DashboardComponent implements OnInit, OnDestroy {
  public readonly routes = routes;
  public readonly appointmentListQuery: Record<string, string> = {
    view: 'list',
  };
  public date: Date = new Date();
  public appointmentCalendarQuery: Record<string, string> =
    this.buildAppointmentsCalendarQuery(this.date);
  public appointmentDates = new Set<string>();
  public blockedDates = new Set<string>();
  public specialists: Specialist[] = [];
  public sortedSpecialists: Specialist[] = [];
  public services: Service[] = [];
  public isLoadingSpecialists = false;
  public isLoadingServices = false;
  private visibleMonthDate = new Date(this.date);
  private activeCenterSubscription?: Subscription;
  private activeCenterId: number | null = null;
  private appointmentCountBySpecialistId = new Map<number, number>();

  constructor(
    private readonly router: Router,
    private readonly primeNg: PrimeNG,
    private readonly i18nService: I18nService,
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: AvailabilityService,
    private readonly specialistsService: SpecialistsService,
    private readonly servicesService: ServicesService,
    private readonly activeCenterService: ActiveCenterService,
  ) {}

  ngOnInit(): void {
    this.setCalendarLocale();
    this.activeCenterSubscription =
      this.activeCenterService.activeCenter$.subscribe(center => {
        this.activeCenterId = center?.id ?? null;
        this.loadCenterDashboardData();
      });
  }

  ngOnDestroy(): void {
    this.activeCenterSubscription?.unsubscribe();
  }

  public openAppointmentsCalendar(date: Date | unknown): void {
    const selectedDate = date instanceof Date ? date : this.date;

    this.date = selectedDate;
    this.appointmentCalendarQuery = this.buildAppointmentsCalendarQuery(selectedDate);

    void this.router.navigate([routes.appointment], {
      queryParams: this.appointmentCalendarQuery,
    });
  }

  public handleCalendarMonthChange(
    event: DatePickerMonthChangeEvent | DatePickerYearChangeEvent,
  ): void {
    if (!event.month || !event.year) return;

    this.visibleMonthDate = new Date(event.year, event.month - 1, 1);
    this.loadCalendarIndicators();
  }

  public hasAppointmentIndicator(date: DashboardCalendarDate): boolean {
    return this.appointmentDates.has(this.toDateMetaQuery(date));
  }

  public hasBlockedIndicator(date: DashboardCalendarDate): boolean {
    return this.blockedDates.has(this.toDateMetaQuery(date));
  }

  public trackBySpecialistId(_: number, specialist: Specialist): number {
    return specialist.id;
  }

  public trackByServiceId(_: number, service: Service): number {
    return service.id;
  }

  public specialistStatusLabel(specialist: Specialist): string {
    const status = this.resolveSpecialistStatus(specialist);

    return this.i18nService.translate(
      `specialists.status.${status.toLowerCase()}`,
    );
  }

  public specialistStatusDotClass(specialist: Specialist): string {
    const status = this.resolveSpecialistStatus(specialist);

    if (status === 'ACTIVE') return 'dashboard-status-dot-active';

    if (status === 'VACATION') return 'dashboard-status-dot-vacation';

    return 'dashboard-status-dot-inactive';
  }

  public specialistInitials(specialist: Specialist): string {
    return this.getInitials(specialist.name);
  }

  public specialistAppointmentCount(specialist: Specialist): number {
    return this.getSpecialistAppointmentCount(specialist.id);
  }

  public serviceSpecialistName(service: Service): string {
    return (
      service.specialist?.name ??
      this.i18nService.translate('services.fields.noSpecialist')
    );
  }

  private loadCenterDashboardData(): void {
    this.loadCalendarIndicators();
    this.loadSpecialists();
    this.loadServices();
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  private loadCalendarIndicators(): void {
    const range = this.getVisibleMonthRange();
    const startDate = this.toDateQuery(range.start);
    const endDate = this.toDateQuery(range.end);

    forkJoin({
      appointments: this.appointmentsService.getAppointments(this.activeCenterId),
      exceptions: this.availabilityService.getAvailabilityExceptions(
        this.activeCenterId,
        startDate,
        endDate,
      ),
    }).subscribe({
      next: ({ appointments, exceptions }) => {
        this.appointmentCountBySpecialistId =
          this.buildSpecialistAppointmentCounts(appointments);
        this.updateSortedSpecialists();
        this.appointmentDates = new Set(
          appointments
            .map(appointment =>
              this.toDateQuery(new Date(appointment.startDateTime)),
            )
            .filter(date => date >= startDate && date <= endDate),
        );
        this.blockedDates = new Set(
          exceptions
            .filter(exception => exception.type === 'BLOCKED')
            .map(exception => exception.date),
        );
      },
      error: () => {
        this.appointmentCountBySpecialistId = new Map();
        this.updateSortedSpecialists();
        this.appointmentDates = new Set();
        this.blockedDates = new Set();
      },
    });
  }

  private loadSpecialists(): void {
    this.isLoadingSpecialists = true;

    this.specialistsService
      .getAllSpecialists(this.activeCenterId)
      .pipe(finalize(() => (this.isLoadingSpecialists = false)))
      .subscribe({
        next: specialists => {
          this.specialists = specialists;
          this.updateSortedSpecialists();
        },
        error: () => {
          this.specialists = [];
          this.updateSortedSpecialists();
        },
      });
  }

  private loadServices(): void {
    this.isLoadingServices = true;

    this.servicesService
      .getServices(this.activeCenterId)
      .pipe(finalize(() => (this.isLoadingServices = false)))
      .subscribe({
        next: services => {
          this.services = services;
        },
        error: () => {
          this.services = [];
        },
      });
  }

  private getVisibleMonthRange(): { start: Date; end: Date } {
    const year = this.visibleMonthDate.getFullYear();
    const month = this.visibleMonthDate.getMonth();

    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0),
    };
  }

  private setCalendarLocale(): void {
    const locale =
      this.i18nService.currentLanguage === 'es' ? 'es-ES' : 'en-US';

    this.primeNg.setTranslation({
      dayNames: this.getWeekdayNames(locale, 'long'),
      dayNamesShort: this.getWeekdayNames(locale, 'short'),
      dayNamesMin: this.getWeekdayNames(locale, 'narrow'),
      monthNames: this.getMonthNames(locale, 'long'),
      monthNamesShort: this.getMonthNames(locale, 'short'),
      today: this.i18nService.translate('appointments.calendar.today'),
      clear: this.i18nService.translate('common.cancel'),
      dateFormat: 'dd/mm/yy',
      firstDayOfWeek: 1,
    });
  }

  private getWeekdayNames(
    locale: string,
    weekday: Intl.DateTimeFormatOptions['weekday'],
  ): string[] {
    const sunday = new Date(2026, 4, 31);
    const formatter = new Intl.DateTimeFormat(locale, { weekday });

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);

      return formatter.format(date);
    });
  }

  private getMonthNames(
    locale: string,
    month: Intl.DateTimeFormatOptions['month'],
  ): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { month });

    return Array.from({ length: 12 }, (_, index) =>
      formatter.format(new Date(2026, index, 1))
    );
  }

  private resolveSpecialistStatus(specialist: Specialist): SpecialistStatus {
    return specialist.status ?? (specialist.active ? 'ACTIVE' : 'INACTIVE');
  }

  private buildSpecialistAppointmentCounts(
    appointments: Appointment[],
  ): Map<number, number> {
    const counts = new Map<number, number>();

    appointments.forEach(appointment => {
      const specialistId = appointment.specialist.id;

      counts.set(specialistId, (counts.get(specialistId) ?? 0) + 1);
    });

    return counts;
  }

  private updateSortedSpecialists(): void {
    this.sortedSpecialists = [...this.specialists].sort((first, second) => {
      const appointmentDiff =
        this.getSpecialistAppointmentCount(second.id) -
        this.getSpecialistAppointmentCount(first.id);

      return appointmentDiff || first.name.localeCompare(second.name);
    });
  }

  private getSpecialistAppointmentCount(specialistId: number): number {
    return this.appointmentCountBySpecialistId.get(specialistId) ?? 0;
  }

  private buildAppointmentsCalendarQuery(date: Date): Record<string, string> {
    return {
      view: 'calendar',
      calendarView: 'day',
      date: this.toDateQuery(date),
    };
  }

  private toDateQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toDateMetaQuery(date: DashboardCalendarDate): string {
    return this.toDateQuery(new Date(date.year, date.month, date.day));
  }
}
