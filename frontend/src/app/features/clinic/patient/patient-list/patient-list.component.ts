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
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class PatientListComponent implements OnInit, OnDestroy {
  public clients: Client[] = [];
  public filteredClients: Client[] = [];
  public centers: Center[] = [];
  public activeCenter: Center | null = null;
  public currentUser: CurrentUser | null = null;
  public searchTerm = '';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isChangingStatus = false;
  public isFormModalOpen = false;
  public isStatusModalOpen = false;
  public editingClient: Client | null = null;
  public clientToChangeStatus: Client | null = null;
  public selectedStatus = true;
  public form: ClientForm = this.getEmptyForm();
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
    this.isSaving = true;
    this.clearMessages();

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

  public closeStatusModal(): void {
    if (this.isChangingStatus) return;

    this.isStatusModalOpen = false;
  }

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isStatusModalOpen) this.closeStatusModal();
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

    this.filteredClients = search
      ? this.clients.filter(client =>
          `${client.id} ${client.name} ${client.phone} ${client.email ?? ''} ${client.notes ?? ''} ${client.center?.name ?? ''}`
            .toLowerCase()
            .includes(search)
        )
      : [...this.clients];
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
    return this.isAdmin ? 9 : 8;
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
  }

  public centerName(client: Client): string {
    return client.center?.name ?? this.translate('centers.none');
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
      centerId: this.form.centerId ?? undefined,
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
}
