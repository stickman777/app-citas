import {  Component, ViewEncapsulation } from '@angular/core';
import { routes } from '../../../../shared/routes/routes';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DateRangePickerComponent } from '../../../../common-component/date-range-picker/date-range-picker.component';
import { MatSelectModule } from '@angular/material/select';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { CustomCalendarComponent } from '../../../../common-component/custom-calendar/custom-calendar.component';


@Component({
  selector: 'app-appointment-calendar',
  templateUrl: './appointment-calendar.component.html',
  styleUrls: ['./appointment-calendar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule,RouterLink,DateRangePickerComponent,MatSelectModule,DatePickerModule,FormsModule,CustomCalendarComponent]
})
export class AppointmentCalendarComponent {
routes = routes
  showEventDetailsModal = false;
  eventDetails = { title: '' };
  date: Date[] | undefined;
  dropdownOpen = false;
  selectedTime: Date = new Date();
  addtime2: Date | undefined;
  addtime: Date | undefined;
  time: Date[] | undefined; 
  time2: Date[] | undefined; 
  bsInlineValue = new Date()


  ngOnInit(): void {}
    // Open the dropdown
    openDropdown() {
      this.dropdownOpen = true;
    }

    // Close the dropdown
    closeDropdown() {
      this.dropdownOpen = false;
    }

    // Update displayed time when selection changes
    onTimeChange() {
      this.closeDropdown(); // Close dropdown after time selection
    }

  handleEventDetailsClose() {
    this.showEventDetailsModal = false;
  }
}
