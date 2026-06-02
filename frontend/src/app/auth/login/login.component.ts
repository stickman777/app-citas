import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { routes } from '../../shared/routes/routes';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class LoginComponent {
  public passwordClass = false;
  public email = '';
  public password = '';
  public errorMessage = '';
  public isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
    private i18nService: I18nService
  ) {
    if (this.authService.isAuthenticated()) {
      void this.authService.loadCurrentUser().subscribe({
        next: user => {
          void this.router.navigate([this.getHomeRoute(user.role)]);
        },
        error: () => {
          void this.router.navigate([routes.login]);
        },
      });
    }
  }

  togglePassword(): void {
    this.passwordClass = !this.passwordClass;
  }

  login(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService
      .login({ email: this.email.trim(), password: this.password })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: user => {
          this.toastr.success(this.i18nService.translate('auth.success.login'));
          void this.router.navigate([this.getHomeRoute(user.role)]);
        },
        error: error => {
          this.errorMessage = this.i18nService.translate(
            this.getLoginErrorKey(error)
          );
        },
      });
  }

  private getLoginErrorKey(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'auth.error.apiUnavailable';
    }

    return 'auth.error.invalidCredentials';
  }

  private getHomeRoute(role: 'ADMIN' | 'GESTOR' | 'CLIENT'): string {
    return role === 'CLIENT' ? routes.clientHome : routes.index;
  }
}
