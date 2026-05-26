import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  Service,
  ServicePayload,
  ServicesService,
} from '../../../core/services/services.service';

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: number | null;
  price: number | null;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class ServicesComponent {
  public services: Service[] = [];
  public filteredServices: Service[] = [];
  public searchTerm = '';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isChangingStatus = false;
  public showAll = false;
  public isFormModalOpen = false;
  public isStatusModalOpen = false;
  public editingService: Service | null = null;
  public serviceToChangeStatus: Service | null = null;
  public selectedStatus = true;
  public form: ServiceForm = this.getEmptyForm();

  constructor(private readonly servicesService: ServicesService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  public loadServices(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    const request = this.showAll
      ? this.servicesService.getAllServices()
      : this.servicesService.getServices();

    request.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: services => {
        this.services = services;
        this.applySearch();
      },
      error: () => {
        this.errorMessage = 'No se han podido cargar los servicios.';
      },
    });
  }

  public toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.loadServices();
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.editingService = null;
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public openEditModal(service: Service): void {
    this.clearMessages();
    this.editingService = service;
    this.form = {
      name: service.name,
      description: service.description ?? '',
      durationMinutes: service.durationMinutes,
      price: service.price == null ? null : Number(service.price),
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveService(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Completa los campos obligatorios correctamente.';
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    const payload = this.getPayload();
    const request = this.editingService
      ? this.servicesService.updateService(this.editingService.id, payload)
      : this.servicesService.createService(payload);

    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingService
          ? 'Servicio actualizado correctamente.'
          : 'Servicio creado correctamente.';
        this.isFormModalOpen = false;
        this.loadServices(false);
      },
      error: () => {
        this.errorMessage = 'No se ha podido guardar el servicio.';
      },
    });
  }

  public openStatusModal(service: Service): void {
    this.clearMessages();
    this.serviceToChangeStatus = service;
    this.selectedStatus = service.active;
    this.isStatusModalOpen = true;
  }

  public closeStatusModal(): void {
    if (this.isChangingStatus) return;

    this.isStatusModalOpen = false;
  }

  public changeServiceStatus(): void {
    if (!this.serviceToChangeStatus) return;

    const service = this.serviceToChangeStatus;

    if (service.active === this.selectedStatus) {
      this.isStatusModalOpen = false;
      this.serviceToChangeStatus = null;
      return;
    }

    this.isChangingStatus = true;
    this.clearMessages();

    const request = this.selectedStatus
      ? this.servicesService.activateService(service.id)
      : this.servicesService.deactivateService(service.id);

    request.pipe(finalize(() => (this.isChangingStatus = false))).subscribe({
      next: () => {
        this.successMessage = this.selectedStatus
          ? 'Servicio activado correctamente.'
          : 'Servicio desactivado correctamente.';
        this.isStatusModalOpen = false;
        this.serviceToChangeStatus = null;
        this.loadServices(false);
      },
      error: () => {
        this.errorMessage = 'No se ha podido cambiar el estado del servicio.';
      },
    });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredServices = search
      ? this.services.filter(service =>
          `${service.id} ${service.name} ${service.description ?? ''} ${service.durationMinutes} ${service.price ?? ''}`
            .toLowerCase()
            .includes(search)
        )
      : [...this.services];
  }

  public formatPrice(price: Service['price']): string {
    if (price == null || price === '') return '-';

    return `${Number(price).toFixed(2)} EUR`;
  }

  public statusBadgeClass(service: Service): string {
    return service.active
      ? 'badge-soft-success border-success text-success'
      : 'badge-soft-danger border-danger text-danger';
  }

  public trackByServiceId(_: number, service: Service): number {
    return service.id;
  }

  private getPayload(): ServicePayload {
    const description = this.form.description.trim();

    return {
      name: this.form.name.trim(),
      description: description || null,
      durationMinutes: Number(this.form.durationMinutes),
      price: this.form.price == null ? null : Number(this.form.price),
    };
  }

  public isFormValid(): boolean {
    const duration = Number(this.form.durationMinutes);
    const price = this.form.price;

    return (
      !!this.form.name.trim() &&
      Number.isFinite(duration) &&
      duration > 0 &&
      (price == null || Number(price) >= 0)
    );
  }

  private getEmptyForm(): ServiceForm {
    return {
      name: '',
      description: '',
      durationMinutes: null,
      price: null,
    };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
