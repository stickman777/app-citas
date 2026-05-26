import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Client,
  ClientPayload,
  ClientsService,
} from '../../../../core/clients/clients.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

interface ClientForm {
  name: string;
  phone: string;
  email: string;
  notes: string;
  priority: number;
}

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class PatientListComponent {
  public clients: Client[] = [];
  public filteredClients: Client[] = [];
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

  constructor(
    private readonly clientsService: ClientsService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  public loadClients(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    this.clientsService.getClients().subscribe({
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
          `${client.id} ${client.name} ${client.phone} ${client.email ?? ''} ${client.notes ?? ''}`
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

  private getPayload(): ClientPayload {
    const email = this.form.email.trim();
    const notes = this.form.notes.trim();

    return {
      name: this.form.name.trim(),
      phone: this.form.phone.trim(),
      priority: Number(this.form.priority) || 0,
      email: email || null,
      notes: notes || null,
    };
  }

  private getEmptyForm(): ClientForm {
    return {
      name: '',
      phone: '',
      email: '',
      notes: '',
      priority: 0,
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
