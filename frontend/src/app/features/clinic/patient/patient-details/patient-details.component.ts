import { Component } from '@angular/core';
import { routes } from '../../../../shared/routes/routes';
import { CommonModule } from '@angular/common';
import { DateRangePickerComponent } from '../../../../common-component/date-range-picker/date-range-picker.component';
import { RouterLink } from '@angular/router';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-patient-details',
  templateUrl: './patient-details.component.html',
  styleUrls: ['./patient-details.component.scss'],
  imports: [CommonModule,DateRangePickerComponent,RouterLink,BsDatepickerModule]
})
export class PatientDetailsComponent {
routes=routes
}
