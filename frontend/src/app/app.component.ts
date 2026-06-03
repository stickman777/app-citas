import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

import { SettingsService } from './shared/settings/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(
    settings: SettingsService,
    title: Title,
  ) {
    settings.applyStoredThemeColor();
    title.setTitle('TFG | App Citas');
  }
}
