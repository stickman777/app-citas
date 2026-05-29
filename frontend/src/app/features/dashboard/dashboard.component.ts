import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { routes } from '../../shared/routes/routes';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, RouterLink, DatePickerModule, FormsModule, TranslatePipe],
})
export class DashboardComponent {
  public routes = routes;
  public date: Date | undefined;

  constructor(private readonly router: Router) {}

  public openAppointmentsCalendar(date: Date): void {
    void this.router.navigate([routes.appointment], {
      queryParams: this.appointmentsCalendarQuery(date),
    });
  }

  public appointmentsCalendarQuery(date = this.date ?? new Date()): Record<string, string> {
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
}
