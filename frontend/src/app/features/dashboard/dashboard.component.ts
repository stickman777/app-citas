import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { Observable } from 'rxjs';

import { ActiveCenterService } from '../../core/centers/active-center.service';
import { Center } from '../../core/centers/centers.service';
import { routes } from '../../shared/routes/routes';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, RouterLink, DatePickerModule, FormsModule],
})
export class DashboardComponent {
  public routes = routes;
  public date: Date[] | undefined;
  public activeCenter$: Observable<Center | null>;

  constructor(private readonly activeCenterService: ActiveCenterService) {
    this.activeCenter$ = this.activeCenterService.activeCenter$;
  }
}
