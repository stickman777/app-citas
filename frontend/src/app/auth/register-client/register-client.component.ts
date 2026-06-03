import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { routes } from '../../shared/routes/routes';

@Component({
  selector: 'app-register-client',
  templateUrl: './register-client.component.html',
  styleUrls: ['./register-client.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
})
export class RegisterClientComponent {
  public readonly routes = routes;
  public invitationToken = '';
  public name = '';
  public email = '';
  public password = '';
  public confirmPassword = '';
  public isLoading = false;
  public errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly i18nService: I18nService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.invitationToken = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  public get passwordMismatch(): boolean {
    return !!this.password && this.password !== this.confirmPassword;
  }

  public register(): void {
    if (!this.invitationToken) {
      this.errorMessage = this.translate('auth.register.errors.token');
      return;
    }

    if (this.passwordMismatch) {
      this.errorMessage = this.translate('account.errors.passwordMismatch');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .registerClient({
        invitationToken: this.invitationToken,
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          void this.router.navigate([routes.clientHome]);
        },
        error: () => {
          this.errorMessage = this.translate('auth.register.errors.save');
        },
      });
  }

  private translate(key: string): string {
    return this.i18nService.translate(key);
  }
}
