import { Component } from '@angular/core';
import { routes } from '../../../../../src/app/shared/routes/routes';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-under-maintenance',
  templateUrl: './under-maintenance.component.html',
  styleUrls: ['./under-maintenance.component.scss'],
  imports:[CommonModule,RouterLink]
})
export class UnderMaintenanceComponent {
routes=routes
}
