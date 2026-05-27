import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  public date: Date[] | undefined;
}
