import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ActiveCenterService } from '../../../../core/centers/active-center.service';
import { Center, CentersService } from '../../../../core/centers/centers.service';
import {
  Client,
  ClientPayload,
  ClientsService,
} from '../../../../core/clients/clients.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { AuthService, CurrentUser } from '../../../../core/auth/auth.service';
import { CrudFilterComponent } from '../../../../common-component/crud-filter/crud-filter.component';

type ClientStatusFilter = 'all' | 'active' | 'inactive';
type ClientAccountFilter = 'all' | 'linked' | 'pending';

interface ClientForm {
  name: string;
  phone: string;
  email: string;
  notes: string;
  priority: number;
  centerId: number | null;
}

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe, CrudFilterComponent],
})
export class PatientListComponent implements OnInit, OnDestroy {
  public clients: Client[] = [];
  public filteredClients: Client[] = [];
  public centers: Center[] = [];
  public activeCenter: Center | null = null;
  public currentUser: CurrentUser | null = null;
  public searchTerm = '';
  public filterStatus: ClientStatusFilter = 'all';
  public filterAccount: ClientAccountFilter = 'all';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isCreatingInvitation = false;
  public isChangingStatus = false;
  public isFormModalOpen = false;
  public isAccountModalOpen = false;
  public isStatusModalOpen = false;
  public editingClient: Client | null = null;
  public clientToCreateAccount: Client | null = null;
  public clientToChangeStatus: Client | null = null;
  public selectedStatus = true;
  public form: ClientForm = this.getEmptyForm();
  public invitationLink = '';
  public invitationExpiresAt = '';
  private activeCenterSubscription?: Subscription;
  private currentUserSubscription?: Subscription;
  private loadedCenterId?: number | null;

  constructor(
    private readonly clientsService: ClientsService,
    private readonly centersService: CentersService,
    private readonly activeCenterService: ActiveCenterService,
    private readonly authService: AuthService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.watchCurrentUser();
    this.loadCenters();
    this.activeCenterSubscription = this.activeCenterService.activeCenter$.subscribe(
      center => {
        const centerId = center?.id ?? null;

        if (centerId === this.loadedCenterId) return;

        this.activeCenter = center;
        this.loadedCenterId = centerId;
        this.loadClients();
      }
    );
  }

  ngOnDestroy(): void {
    this.activeCenterSubscription?.unsubscribe();
    this.currentUserSubscription?.unsubscribe();
  }

  public loadClients(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    this.clientsService.getClients(this.activeCenter?.id).subscribe({
      next: clients => {
        this.clients = clients;
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.translate('clients.errors.load');
        this.isLoading = false;
      },
    });
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.editingClient = null;
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public openEditModal(client: Client): void {
    this.clearMessages();
    this.editingClient = client;
    this.form = {
      name: client.name,
      phone: client.phone,
      email: client.email ?? '',
      notes: client.notes ?? '',
      priority: client.priority,
      centerId: client.center?.id ?? this.activeCenter?.id ?? null,
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveClient(): void {
    this.clearMessages();

    if (!this.form.centerId) {
      this.errorMessage = this.translate('clients.errors.centerRequired');
      return;
    }

    this.isSaving = true;

    const payload = this.getPayload();
    const request = this.editingClient
      ? this.clientsService.updateClient(this.editingClient.id, payload)
      : this.clientsService.createClient(payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingClient
          ? this.translate('clients.success.updated')
          : this.translate('clients.success.created');
        this.isSaving = false;
        this.isFormModalOpen = false;
        this.loadClients(false);
      },
      error: () => {
        this.errorMessage = this.translate('clients.errors.save');
        this.isSaving = false;
      },
    });
  }

  public openStatusModal(client: Client): void {
    this.clearMessages();
    this.clientToChangeStatus = client;
    this.selectedStatus = client.active;
    this.isStatusModalOpen = true;
  }

  public openAccountModal(client: Client): void {
    if (client.user) return;

    this.clearMessages();
    this.clientToCreateAccount = client;
    this.invitationLink = '';
    this.invitationExpiresAt = '';
    this.isAccountModalOpen = true;
  }

  public closeAccountModal(): void {
    if (this.isCreatingInvitation) return;

    this.isAccountModalOpen = false;
  }

  public closeStatusModal(): void {
    if (this.isChangingStatus) return;

    this.isStatusModalOpen = false;
  }

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isAccountModalOpen) this.closeAccountModal();
    if (this.isStatusModalOpen) this.closeStatusModal();
  }

  public createClientInvitation(): void {
    if (!this.clientToCreateAccount) return;

    this.isCreatingInvitation = true;
    this.clearMessages();

    this.clientsService
      .createClientInvitation(this.clientToCreateAccount.id)
      .subscribe({
        next: invitation => {
          this.invitationLink = this.buildInvitationLink(invitation.token);
          this.invitationExpiresAt = this.formatDate(invitation.expiresAt);
          this.successMessage = this.translate('clients.success.invitationCreated');
          this.isCreatingInvitation = false;
          this.loadClients(false);
        },
        error: () => {
          this.errorMessage = this.translate('clients.errors.invitation');
          this.isCreatingInvitation = false;
        },
      });
  }

  public changeClientStatus(): void {
    if (!this.clientToChangeStatus) return;

    const client = this.clientToChangeStatus;

    if (client.active === this.selectedStatus) {
      this.isStatusModalOpen = false;
      this.clientToChangeStatus = null;
      return;
    }

    this.isChangingStatus = true;
    this.clearMessages();

    const request = this.selectedStatus
      ? this.clientsService.activateClient(client.id)
      : this.clientsService.deactivateClient(client.id);

    request.subscribe({
      next: () => {
        this.successMessage = this.selectedStatus
          ? this.translate('clients.success.activated')
          : this.translate('clients.success.deactivated');
        this.isChangingStatus = false;
        this.isStatusModalOpen = false;
        this.clientToChangeStatus = null;
        this.loadClients(false);
      },
      error: () => {
        this.errorMessage = this.translate('clients.errors.status');
        this.isChangingStatus = false;
      },
    });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredClients = this.clients.filter(client => {
      const matchesSearch =
        !search ||
        `${client.id} ${client.name} ${client.phone} ${client.email ?? ''} ${client.notes ?? ''} ${client.center?.name ?? ''}`
          .toLowerCase()
          .includes(search);
      const matchesStatus =
        this.filterStatus === 'all' ||
        (this.filterStatus === 'active' && client.active) ||
        (this.filterStatus === 'inactive' && !client.active);
      const matchesAccount =
        this.filterAccount === 'all' ||
        (this.filterAccount === 'linked' && !!client.user) ||
        (this.filterAccount === 'pending' && !client.user);

      return matchesSearch && matchesStatus && matchesAccount;
    });
  }

  public clearFilters(): void {
    this.filterStatus = 'all';
    this.filterAccount = 'all';
    this.applySearch();
  }

  public statusBadgeClass(client: Client): string {
    return client.active
      ? 'badge-soft-success border-success text-success'
      : 'badge-soft-danger border-danger text-danger';
  }

  public trackByClientId(_: number, client: Client): number {
    return client.id;
  }

  public get centerOptions(): Center[] {
    return this.withCurrentOption(this.centers, this.editingClient?.center);
  }

  public get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  public get clientTableColumnCount(): number {
    return 6;
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
  }

  public accountLabel(client: Client): string {
    return client.user
      ? this.translate('clients.account.linked')
      : this.translate('clients.pending');
  }

  public whatsappUrl(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const nationalNumber = digits.startsWith('0034')
      ? digits.slice(4)
      : digits.startsWith('34')
        ? digits.slice(2)
        : digits;

    return `https://wa.me/34${nationalNumber}`;
  }

  private getPayload(): ClientPayload {
    const email = this.form.email.trim();
    const notes = this.form.notes.trim();

    return {
      name: this.form.name.trim(),
      phone: this.form.phone.trim(),
      priority: Number(this.form.priority) || 0,
      email: email || null,
      notes: notes || null,
      centerId: this.form.centerId,
    };
  }

  private getEmptyForm(): ClientForm {
    return {
      name: '',
      phone: '',
      email: '',
      notes: '',
      priority: 0,
      centerId: this.activeCenter?.id ?? null,
    };
  }

  private loadCenters(): void {
    this.centersService.getCenters().subscribe({
      next: centers => {
        this.centers = centers;
        this.activeCenterService.setAvailableCenters(centers);
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

  private withCurrentOption<T extends { id: number }>(
    options: T[],
    current?: T | null,
  ): T[] {
    if (!current || options.some(option => option.id === current.id)) {
      return options;
    }

    return [current, ...options];
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private translate(key: string): string {
    return this.i18nService.translate(key);
  }

  private buildInvitationLink(token: string): string {
    return `${window.location.origin}/register-client?token=${encodeURIComponent(token)}`;
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
