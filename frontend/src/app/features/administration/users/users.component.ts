import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserRole,
  UsersService,
} from '../../../core/users/users.service';

interface UserForm {
  email: string;
  password: string;
  role: UserRole;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class UsersComponent {
  public readonly roleOptions: UserRole[] = ['ADMIN', 'GESTOR', 'CLIENT'];
  public users: User[] = [];
  public filteredUsers: User[] = [];
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

  constructor(private readonly usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
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
        this.errorMessage = 'No se han podido cargar los usuarios.';
        this.isLoading = false;
      },
    });
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.editingUser = null;
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public openEditModal(user: User): void {
    this.clearMessages();
    this.editingUser = user;
    this.form = {
      email: user.email,
      password: '',
      role: user.role,
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveUser(): void {
    this.isSaving = true;
    this.clearMessages();

    const request = this.editingUser
      ? this.usersService.updateUser(this.editingUser.id, this.getUpdatePayload())
      : this.usersService.createUser(this.getCreatePayload());

    request.subscribe({
      next: () => {
        this.successMessage = this.editingUser
          ? 'Usuario actualizado correctamente.'
          : 'Usuario creado correctamente.';
        this.isSaving = false;
        this.isFormModalOpen = false;
        this.loadUsers(false);
      },
      error: () => {
        this.errorMessage = 'No se ha podido guardar el usuario.';
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

  public deleteUser(): void {
    if (!this.userToDelete) return;

    this.isDeleting = true;
    this.clearMessages();

    this.usersService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Usuario eliminado correctamente.';
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.userToDelete = null;
        this.loadUsers(false);
      },
      error: () => {
        this.errorMessage = 'No se ha podido eliminar el usuario.';
        this.isDeleting = false;
      },
    });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredUsers = search
      ? this.users.filter(user =>
          `${user.id} ${user.email} ${user.role}`.toLowerCase().includes(search)
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

  public trackByUserId(_: number, user: User): number {
    return user.id;
  }

  private getCreatePayload(): CreateUserPayload {
    return {
      email: this.form.email.trim(),
      password: this.form.password,
      role: this.form.role,
    };
  }

  private getUpdatePayload(): UpdateUserPayload {
    const payload: UpdateUserPayload = {
      email: this.form.email.trim(),
      role: this.form.role,
    };

    if (this.form.password.trim()) {
      payload.password = this.form.password;
    }

    return payload;
  }

  private getEmptyForm(): UserForm {
    return {
      email: '',
      password: '',
      role: 'CLIENT',
    };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

}
