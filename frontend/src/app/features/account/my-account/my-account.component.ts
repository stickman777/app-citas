import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AuthService,
  CurrentUser,
  UpdateCurrentUserPayload,
} from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { UserRole } from '../../../core/users/users.service';

interface AccountForm {
  email: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class MyAccountComponent {
  public currentUser: CurrentUser | null = null;
  public form: AccountForm = this.getEmptyForm();
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;

  constructor(
    private readonly authService: AuthService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  public saveProfile(): void {
    if (this.passwordMismatch) {
      this.errorMessage = this.translate('account.errors.passwordMismatch');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    this.authService.updateCurrentUser(this.getPayload()).subscribe({
      next: user => {
        this.currentUser = user;
        this.form = {
          email: user.email,
          currentPassword: '',
          password: '',
          confirmPassword: '',
        };
        this.successMessage = this.translate('account.success.updated');
        this.isSaving = false;
      },
      error: () => {
        this.errorMessage = this.translate('account.errors.save');
        this.isSaving = false;
      },
    });
  }

  public resetForm(): void {
    if (!this.currentUser || this.isSaving) return;

    this.clearMessages();
    this.form = {
      email: this.currentUser.email,
      currentPassword: '',
      password: '',
      confirmPassword: '',
    };
  }

  public roleBadgeClass(role: CurrentUser['role']): string {
    const classes: Record<UserRole, string> = {
      ADMIN: 'badge-soft-danger border-danger text-danger',
      GESTOR: 'badge-soft-primary border-primary text-primary',
      CLIENT: 'badge-soft-success border-success text-success',
    };

    return classes[role];
  }

  public get passwordMismatch(): boolean {
    return (
      !!this.form.password && this.form.password !== this.form.confirmPassword
    );
  }

  public get assignedCentersText(): string {
    return this.currentUser?.centers?.length
      ? this.currentUser.centers.map(center => center.name).join(', ')
      : this.translate('centers.none');
  }

  public trackByCenterId(_: number, center: { id: number }): number {
    return center.id;
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.clearMessages();

    this.authService.loadCurrentUser(true).subscribe({
      next: user => {
        this.currentUser = user;
        this.form = {
          email: user.email,
          currentPassword: '',
          password: '',
          confirmPassword: '',
        };
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.translate('account.errors.load');
        this.isLoading = false;
      },
    });
  }

  private getPayload(): UpdateCurrentUserPayload {
    const payload: UpdateCurrentUserPayload = {
      email: this.form.email.trim(),
    };

    if (this.form.password.trim()) {
      payload.currentPassword = this.form.currentPassword;
      payload.password = this.form.password;
    }

    return payload;
  }

  private getEmptyForm(): AccountForm {
    return {
      email: '',
      currentPassword: '',
      password: '',
      confirmPassword: '',
    };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private translate(key: string): string {
    return this.i18nService.translate(key);
  }
}
