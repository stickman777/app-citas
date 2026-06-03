import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AuthService, CurrentUser } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Language, SUPPORTED_LANGUAGES } from '../../core/i18n/translations';
import { routes } from '../../shared/routes/routes';
import { SettingsService } from '../../shared/settings/settings.service';
import { SideBarService } from '../../shared/sidebar/sidebar.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule, RouterLink, TranslatePipe],
})
export class HeaderComponent implements OnDestroy {
  public readonly languageOptions = SUPPORTED_LANGUAGES;
  public readonly routes = routes;
  public currentUser: CurrentUser | null = null;
  public addClass = false;
  public themeColor: 'light' | 'dark' = 'light';

  private currentUserSubscription?: Subscription;

  constructor(
    public sideBar: SideBarService,
    public settings: SettingsService,
    private authService: AuthService,
    private toastr: ToastrService,
    private i18nService: I18nService
  ) {}

  public ngOnInit(): void {
    const savedTheme = localStorage.getItem('themeColor') as 'light' | 'dark' | null;
    this.themeColor = savedTheme || 'light';
    this.sideBar.changeThemeColor(this.themeColor);
    this.loadCurrentUser();
  }

  public ngOnDestroy(): void {
    this.currentUserSubscription?.unsubscribe();
  }

  public toggleMobileSideBar(): void {
    this.sideBar.switchMobileSideBarPosition();

    this.addClass = !this.addClass;
    const root = document.getElementsByTagName('html')[0];
    const sidebar = document.getElementById('sidebar');

    if (this.addClass) {
      root.classList.add('menu-opened');
      sidebar?.classList.add('opened');
    } else {
      root.classList.remove('menu-opened');
      sidebar?.classList.remove('opened');
    }
  }

  public toggleTheme(): void {
    this.themeColor = this.themeColor === 'dark' ? 'light' : 'dark';
    localStorage.setItem('themeColor', this.themeColor);
    this.sideBar.changeThemeColor(this.themeColor);
  }

  public get currentLanguage(): Language {
    return this.i18nService.currentLanguage;
  }

  public setLanguage(language: Language): void {
    this.i18nService.setLanguage(language);
  }

  public logout(): void {
    this.toastr.error(this.i18nService.translate('auth.success.logout'));
    this.authService.logout();
  }

  public get accountAlias(): string {
    return this.formatAlias(this.currentUser?.name) || 'Usuario';
  }

  private formatAlias(alias?: string): string {
    const words = alias?.trim().split(/\s+/).filter(Boolean) ?? [];

    if (words.length <= 1) return words[0] ?? '';

    const [firstWord, ...rest] = words;
    const initials = rest.map(word => `${word.charAt(0).toUpperCase()}.`);

    return [firstWord, ...initials].join(' ');
  }

  private loadCurrentUser(): void {
    this.currentUserSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.authService.getCurrentUser().subscribe({
      next: user => {
        this.currentUser = user;
      },
    });
  }
}
