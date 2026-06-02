import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserRole,
  UsersService,
} from '../../../core/users/users.service';
import { Center, CentersService } from '../../../core/centers/centers.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';

interface UserForm {
  email: string;
  name: string;
  changePassword: boolean;
  password: string;
  confirmPassword: string;
  role: UserRole;
  centerIds: number[];
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class UsersComponent implements OnDestroy {
  public readonly roleOptions: UserRole[] = ['ADMIN', 'GESTOR', 'CLIENT'];
  public users: User[] = [];
  public filteredUsers: User[] = [];
  public centers: Center[] = [];
  public currentUser: CurrentUser | null = null;
  public searchTerm = '';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isDeleting = false;
  public isFormModalOpen = false;
  public isDeleteModalOpen = false;
  public editingUser: User | null = null;
  public userToDelete: User | null = null;
  public form: UserForm = this.getEmptyForm();
  private currentUserSubscription?: Subscription;

  constructor(
    private readonly usersService: UsersService,
    private readonly centersService: CentersService,
    private readonly authService: AuthService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.watchCurrentUser();
    this.loadCenters();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.currentUserSubscription?.unsubscribe();
  }

  public loadUsers(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    this.usersService.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.translate('users.errors.load');
        this.isLoading = false;
      },
    });
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.editingUser = null;
    this.form = this.getEmptyForm();
    this.form.changePassword = true;
    this.isFormModalOpen = true;
  }

  public openEditModal(user: User): void {
    this.clearMessages();
    this.editingUser = user;
    this.form = {
      email: user.email,
      name: user.name,
      changePassword: false,
      password: '',
      confirmPassword: '',
      role: user.role,
      centerIds: user.centers?.map(center => center.id) ?? [],
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveUser(): void {
    if (this.passwordMismatch) {
      this.errorMessage = this.translate('users.errors.passwordMismatch');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    const request = this.editingUser
      ? this.usersService.updateUser(this.editingUser.id, this.getUpdatePayload())
      : this.usersService.createUser(this.getCreatePayload());

    request.subscribe({
      next: () => {
        this.successMessage = this.editingUser
          ? this.translate('users.success.updated')
          : this.translate('users.success.created');
        this.isSaving = false;
        this.isFormModalOpen = false;
        this.loadUsers(false);
      },
      error: () => {
        this.errorMessage = this.translate('users.errors.save');
        this.isSaving = false;
      },
    });
  }

  public openDeleteModal(user: User): void {
    this.clearMessages();
    this.userToDelete = user;
    this.isDeleteModalOpen = true;
  }

  public closeDeleteModal(): void {
    if (this.isDeleting) return;

    this.isDeleteModalOpen = false;
  }

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isDeleteModalOpen) this.closeDeleteModal();
  }

  public deleteUser(): void {
    if (!this.userToDelete) return;

    this.isDeleting = true;
    this.clearMessages();

    this.usersService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.successMessage = this.translate('users.success.deleted');
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.userToDelete = null;
        this.loadUsers(false);
      },
      error: () => {
        this.errorMessage = this.translate('users.errors.delete');
        this.isDeleting = false;
      },
    });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredUsers = search
      ? this.users.filter(user =>
          `${user.id} ${user.name} ${user.email} ${user.role} ${this.centerNames(user)}`
            .toLowerCase()
            .includes(search)
        )
      : [...this.users];
  }

  public roleBadgeClass(role: UserRole): string {
    const classes: Record<UserRole, string> = {
      ADMIN: 'badge-soft-danger border-danger text-danger',
      GESTOR: 'badge-soft-primary border-primary text-primary',
      CLIENT: 'badge-soft-success border-success text-success',
    };

    return classes[role];
  }

  public get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  public get userTableColumnCount(): number {
    return this.isAdmin ? 5 : 4;
  }

  public trackByUserId(_: number, user: User): number {
    return user.id;
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
  }

  public centerNames(user: User): string {
    if (user.role === 'ADMIN') return this.translate('users.centers.all');

    return user.centers?.length
      ? user.centers.map(center => center.name).join(', ')
      : this.translate('centers.none');
  }

  public toggleCenter(centerId: number, checked: boolean): void {
    this.form.centerIds = checked
      ? [...this.form.centerIds, centerId]
      : this.form.centerIds.filter(id => id !== centerId);
  }

  public onRoleChange(role: UserRole): void {
    this.form.role = role;

    if (role === 'ADMIN') {
      this.form.centerIds = [];
      return;
    }

    this.selectDefaultCenter();
  }

  public togglePasswordChange(checked: boolean): void {
    this.form.changePassword = checked;

    if (!checked) {
      this.form.password = '';
      this.form.confirmPassword = '';
    }
  }

  public isCenterSelected(centerId: number): boolean {
    return this.form.centerIds.includes(centerId);
  }

  public get showPasswordFields(): boolean {
    return !this.editingUser || this.form.changePassword;
  }

  public get passwordMismatch(): boolean {
    return (
      this.showPasswordFields &&
      !!this.form.password &&
      this.form.password !== this.form.confirmPassword
    );
  }

  public get requiresCenters(): boolean {
    return this.form.role === 'GESTOR' || this.form.role === 'CLIENT';
  }

  public get centerSelectionInvalid(): boolean {
    return this.requiresCenters && this.form.centerIds.length === 0;
  }

  private loadCenters(): void {
    this.centersService.getCenters().subscribe({
      next: centers => {
        this.centers = centers;
        if (this.requiresCenters) this.selectDefaultCenter();
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.load');
      },
    });
  }

  private watchCurrentUser(): void {
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

  private getCreatePayload(): CreateUserPayload {
    return {
      email: this.form.email.trim(),
      name: this.form.name.trim(),
      password: this.form.password,
      role: this.form.role,
      centerIds: this.getRoleCenterIds(),
    };
  }

  private getUpdatePayload(): UpdateUserPayload {
    const payload: UpdateUserPayload = {
      email: this.form.email.trim(),
      name: this.form.name.trim(),
      role: this.form.role,
      centerIds: this.getRoleCenterIds(),
    };

    if (this.form.changePassword && this.form.password.trim()) {
      payload.password = this.form.password;
    }

    return payload;
  }

  private getRoleCenterIds(): number[] {
    return this.requiresCenters ? this.form.centerIds : [];
  }

  private selectDefaultCenter(): void {
    if (this.form.centerIds.length > 0 || this.centers.length === 0) return;

    this.form.centerIds = [this.centers[0].id];
  }

  private getEmptyForm(): UserForm {
    return {
      email: '',
      name: '',
      changePassword: false,
      password: '',
      confirmPassword: '',
      role: 'CLIENT',
      centerIds: [],
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
