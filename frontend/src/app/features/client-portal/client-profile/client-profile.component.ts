import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-client-profile',
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class ClientProfileComponent {}
