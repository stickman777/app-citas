import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { SettingsService } from '../../../shared/settings/settings.service';
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
  public isProfileMenuOpen = false;
  public themeColor = 'light';
  private currentUserSubscription?: Subscription;
  private themeSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
  ) {}

  ngOnInit(): void {
    this.themeColor = this.settingsService.themeColor.value;
    this.themeSubscription = this.settingsService.themeColor.subscribe(
      themeColor => {
        this.themeColor = themeColor;
      }
    );
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
    this.themeSubscription?.unsubscribe();
  }

  public logout(): void {
    this.isProfileMenuOpen = false;
    this.authService.logout();
  }

  public get accountAlias(): string {
    return this.currentUser?.name?.trim() || 'Cliente';
  }

  public toggleTheme(): void {
    this.settingsService.changeThemeColor(
      this.themeColor === 'dark' ? 'light' : 'dark',
    );
  }

  public toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  public closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  public closeOnEscape(): void {
    this.closeProfileMenu();
  }

  @HostListener('document:click')
  public closeOnOutsideClick(): void {
    this.closeProfileMenu();
  }
}
