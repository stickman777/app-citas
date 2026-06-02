import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { routes } from '../../../shared/routes/routes';

@Component({
  selector: 'app-client-layout',
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
  ],
})
export class ClientLayoutComponent implements OnInit, OnDestroy {
  public readonly routes = routes;
  public currentUser: CurrentUser | null = null;
  private currentUserSubscription?: Subscription;

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.currentUserSubscription = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
      }
    );
    this.authService.loadCurrentUser().subscribe({
      error: () => {
        this.currentUser = null;
      },
    });
  }

  ngOnDestroy(): void {
    this.currentUserSubscription?.unsubscribe();
  }

  public logout(): void {
    this.authService.logout();
  }

  public get accountAlias(): string {
    return this.currentUser?.name?.trim() || 'Cliente';
  }
}
