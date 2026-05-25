import { Component } from '@angular/core';
import { routes } from '../../../../shared/routes/routes';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FilterComponent } from '../../../../common-component/filter/filter.component';

@Component({
  selector: 'app-patient-grid',
  templateUrl: './patient-grid.component.html',
  styleUrls: ['./patient-grid.component.scss'],
  imports: [CommonModule,RouterLink,FilterComponent]
})
export class PatientGridComponent {
routes=routes
}
