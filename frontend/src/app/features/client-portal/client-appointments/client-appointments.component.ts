import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-client-appointments',
  templateUrl: './client-appointments.component.html',
  styleUrls: ['./client-appointments.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class ClientAppointmentsComponent {}
