import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import {
  Service,
  ServicePayload,
  ServicesService,
} from '../../../core/services/services.service';
import { ActiveCenterService } from '../../../core/centers/active-center.service';
import { Center, CentersService } from '../../../core/centers/centers.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: number | null;
  price: number | null;
  centerId: number | null;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class ServicesComponent implements OnInit, OnDestroy {
  public services: Service[] = [];
  public filteredServices: Service[] = [];
  public centers: Center[] = [];
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
  public activeCenter: Center | null = null;
  public currentUser: CurrentUser | null = null;
  public selectedStatus = true;
  public form: ServiceForm = this.getEmptyForm();
  private activeCenterSubscription?: Subscription;
  private currentUserSubscription?: Subscription;
  private loadedCenterId?: number | null;

  constructor(
    private readonly servicesService: ServicesService,
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
        this.loadServices();
      }
    );
  }

  ngOnDestroy(): void {
    this.activeCenterSubscription?.unsubscribe();
    this.currentUserSubscription?.unsubscribe();
  }

  public loadServices(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    const request = this.showAll
      ? this.servicesService.getAllServices(this.activeCenter?.id)
      : this.servicesService.getServices(this.activeCenter?.id);

    request.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: services => {
        this.services = services;
        this.applySearch();
      },
      error: () => {
        this.errorMessage = this.translate('services.errors.load');
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
      centerId: service.center?.id ?? this.activeCenter?.id ?? null,
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveService(): void {
    if (!this.isFormValid()) {
      this.errorMessage = this.translate('services.errors.form');
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
          ? this.translate('services.success.updated')
          : this.translate('services.success.created');
        this.isFormModalOpen = false;
        this.loadServices(false);
      },
      error: () => {
        this.errorMessage = this.translate('services.errors.save');
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

  @HostListener('document:keydown.escape')
  public closeOpenModal(): void {
    if (this.isFormModalOpen) this.closeFormModal();
    if (this.isStatusModalOpen) this.closeStatusModal();
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
          ? this.translate('services.success.activated')
          : this.translate('services.success.deactivated');
        this.isStatusModalOpen = false;
        this.serviceToChangeStatus = null;
        this.loadServices(false);
      },
      error: () => {
        this.errorMessage = this.translate('services.errors.status');
      },
    });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredServices = search
      ? this.services.filter(service =>
          `${service.id} ${service.name} ${service.description ?? ''} ${service.durationMinutes} ${service.price ?? ''} ${service.center?.name ?? ''}`
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

  public get centerOptions(): Center[] {
    return this.withCurrentOption(this.centers, this.editingService?.center);
  }

  public get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  public get serviceTableColumnCount(): number {
    return this.isAdmin ? 7 : 6;
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
  }

  public centerName(service: Service): string {
    return service.center?.name ?? this.translate('centers.none');
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

  private getPayload(): ServicePayload {
    const description = this.form.description.trim();

    return {
      name: this.form.name.trim(),
      description: description || null,
      durationMinutes: Number(this.form.durationMinutes),
      price: this.form.price == null ? null : Number(this.form.price),
      centerId: this.form.centerId ?? undefined,
    };
  }

  public isFormValid(): boolean {
    const duration = Number(this.form.durationMinutes);
    const price = this.form.price;

    return (
      !!this.form.name.trim() &&
      Number.isFinite(duration) &&
      duration > 0 &&
      (price == null || Number(price) >= 0) &&
      !!this.form.centerId
    );
  }

  private getEmptyForm(): ServiceForm {
    return {
      name: '',
      description: '',
      durationMinutes: null,
      price: null,
      centerId: this.activeCenter?.id ?? null,
    };
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
