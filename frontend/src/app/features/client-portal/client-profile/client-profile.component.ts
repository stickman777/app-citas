import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import {
  ClientPortalProfile,
  ClientPortalService,
} from '../../../core/client-portal/client-portal.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-client-profile',
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class ClientProfileComponent implements OnInit {
  public profile: ClientPortalProfile | null = null;
  public isLoading = false;
  public errorMessage = '';

  constructor(private readonly clientPortalService: ClientPortalService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  public loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.clientPortalService.getProfile().subscribe({
      next: profile => {
        this.profile = profile;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'client.profile.errors.load';
        this.isLoading = false;
      },
    });
  }
}
