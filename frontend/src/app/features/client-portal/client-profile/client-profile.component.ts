import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import {
  ClientPortalProfile,
  ClientPortalService,
  UpdateClientPortalProfilePayload,
} from '../../../core/client-portal/client-portal.service';
import {
  AuthService,
  CurrentUser,
  UpdateCurrentUserPayload,
} from '../../../core/auth/auth.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

interface ClientProfileForm {
  name: string;
  phone: string;
  email: string;
}

interface AccountForm {
  name: string;
  email: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-client-profile',
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class ClientProfileComponent implements OnInit {
  public profile: ClientPortalProfile | null = null;
  public currentUser: CurrentUser | null = null;
  public clientForm: ClientProfileForm = this.getEmptyClientForm();
  public accountForm: AccountForm = this.getEmptyAccountForm();
  public isLoading = false;
  public isSavingClient = false;
  public isSavingAccount = false;
  public errorMessage = '';
  public successMessage = '';

  constructor(
    private readonly clientPortalService: ClientPortalService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  public loadProfile(): void {
    this.isLoading = true;
    this.clearMessages();

    forkJoin({
      profile: this.clientPortalService.getProfile(),
      currentUser: this.authService.loadCurrentUser(true),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ profile, currentUser }) => {
          this.profile = profile;
          this.currentUser = currentUser;
          this.clientForm = this.toClientForm(profile);
          this.accountForm = this.toAccountForm(currentUser);
        },
        error: () => {
          this.errorMessage = 'client.profile.errors.load';
        },
      });
  }

  public saveClientProfile(): void {
    this.isSavingClient = true;
    this.clearMessages();

    this.clientPortalService
      .updateProfile(this.getClientPayload())
      .pipe(finalize(() => (this.isSavingClient = false)))
      .subscribe({
        next: profile => {
          this.profile = profile;
          this.clientForm = this.toClientForm(profile);
          this.successMessage = 'clients.success.updated';
        },
        error: () => {
          this.errorMessage = 'clients.errors.save';
        },
      });
  }

  public saveAccount(): void {
    this.clearMessages();

    if (this.passwordMismatch) {
      this.errorMessage = 'account.errors.passwordMismatch';
      return;
    }

    this.isSavingAccount = true;

    this.authService
      .updateCurrentUser(this.getAccountPayload())
      .pipe(finalize(() => (this.isSavingAccount = false)))
      .subscribe({
        next: user => {
          this.currentUser = user;
          this.accountForm = this.toAccountForm(user);
          this.successMessage = 'account.success.updated';
        },
        error: () => {
          this.errorMessage = 'account.errors.save';
        },
      });
  }

  public resetClientForm(): void {
    if (!this.profile || this.isSavingClient) return;

    this.clearMessages();
    this.clientForm = this.toClientForm(this.profile);
  }

  public resetAccountForm(): void {
    if (!this.currentUser || this.isSavingAccount) return;

    this.clearMessages();
    this.accountForm = this.toAccountForm(this.currentUser);
  }

  public get passwordMismatch(): boolean {
    return (
      !!this.accountForm.password &&
      this.accountForm.password !== this.accountForm.confirmPassword
    );
  }

  private getClientPayload(): UpdateClientPortalProfilePayload {
    const email = this.clientForm.email.trim();

    return {
      name: this.clientForm.name.trim(),
      phone: this.clientForm.phone.trim(),
      email: email || null,
    };
  }

  private getAccountPayload(): UpdateCurrentUserPayload {
    const payload: UpdateCurrentUserPayload = {
      name: this.accountForm.name.trim(),
      email: this.accountForm.email.trim(),
    };

    if (this.accountForm.password.trim()) {
      payload.currentPassword = this.accountForm.currentPassword;
      payload.password = this.accountForm.password;
    }

    return payload;
  }

  private toClientForm(profile: ClientPortalProfile): ClientProfileForm {
    return {
      name: profile.name,
      phone: profile.phone,
      email: profile.email ?? '',
    };
  }

  private toAccountForm(user: CurrentUser): AccountForm {
    return {
      name: user.name,
      email: user.email,
      currentPassword: '',
      password: '',
      confirmPassword: '',
    };
  }

  private getEmptyClientForm(): ClientProfileForm {
    return {
      name: '',
      phone: '',
      email: '',
    };
  }

  private getEmptyAccountForm(): AccountForm {
    return {
      name: '',
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
}
