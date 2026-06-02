import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { routes } from '../../../shared/routes/routes';

@Component({
  selector: 'app-client-home',
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss'],
  imports: [CommonModule, RouterLink, TranslatePipe],
})
export class ClientHomeComponent {
  public readonly routes = routes;
}
