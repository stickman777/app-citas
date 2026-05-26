import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../core/auth/auth.service';
import { routes } from '../../shared/routes/routes';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule],
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
    private toastr: ToastrService
  ) {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate([routes.index]);
    }
  }

  togglePassword(): void {
    this.passwordClass = !this.passwordClass;
  }

  login(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService
      .login({ email: this.email, password: this.password })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Login correcto.');
          void this.router.navigate([routes.index]);
        },
        error: () => {
          this.errorMessage = 'Email o password incorrectos.';
        },
      });
  }
}
