import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent,CalendarView } from 'angular-calendar';
import {  startOfDay,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths, } from 'date-fns';
import { CalendarWrapperModule } from '../../shared/calendar/calendar-wrapper.module';

@Component({
  selector: 'app-custom-calendar',
  standalone: true,
  imports: [CommonModule, CalendarWrapperModule],
  templateUrl: './custom-calendar.component.html',
  styleUrls: ['./custom-calendar.component.scss'],
})
export class CustomCalendarComponent {
  viewDate: Date = new Date();
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  events: CalendarEvent[] = [
    {
      start: startOfDay(new Date()),
      title: 'Meeting with Team',
      color: { primary: '#1e90ff', secondary: '#D1E8FF' },
    },
  ];
  prevMonth() {
  this.viewDate = subMonths(this.viewDate, 1);
}

nextMonth() {
  this.viewDate = addMonths(this.viewDate, 1);
}


 setView(view: CalendarView) {
    this.view = view;
  }

  today(): void {
    this.viewDate = new Date();
  }

  next(): void {
    this.viewDate = this.changeDateByView(this.viewDate, 1);
  }

  prev(): void {
    this.viewDate = this.changeDateByView(this.viewDate, -1);
  }

  private changeDateByView(date: Date, step: number): Date {
    switch (this.view) {
      case CalendarView.Month:
        return step > 0 ? addMonths(date, 1) : subMonths(date, 1);
      case CalendarView.Week:
        return step > 0 ? addWeeks(date, 1) : subWeeks(date, 1);
      case CalendarView.Day:
        return step > 0 ? addDays(date, 1) : subDays(date, 1);
      default:
        return date;
    }
  }
}
