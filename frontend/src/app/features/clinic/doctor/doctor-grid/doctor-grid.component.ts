import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { routes } from '../../../../shared/routes/routes';
import { FilterComponent } from '../../../../common-component/filter/filter.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-doctor-grid',
  templateUrl: './doctor-grid.component.html',
  styleUrls: ['./doctor-grid.component.scss'],
  imports: [CommonModule,RouterLink,FilterComponent,MatSelectModule,FormsModule]
})
export class DoctorGridComponent {
routes=routes
}
