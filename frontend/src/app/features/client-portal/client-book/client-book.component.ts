import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-client-book',
  templateUrl: './client-book.component.html',
  styleUrls: ['./client-book.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class ClientBookComponent {}
