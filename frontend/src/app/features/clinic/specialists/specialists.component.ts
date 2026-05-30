import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import { ActiveCenterService } from '../../../core/centers/active-center.service';
import { Center, CentersService } from '../../../core/centers/centers.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import {
  Specialist,
  SpecialistPayload,
  SpecialistStatus,
  SpecialistsService,
} from '../../../core/specialists/specialists.service';

interface SpecialistForm {
  name: string;
  specialty: string;
  status: SpecialistStatus;
  centerId: number | null;
}

@Component({
  selector: 'app-specialists',
  templateUrl: './specialists.component.html',
  styleUrls: ['./specialists.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class SpecialistsComponent implements OnInit, OnDestroy {
  public specialists: Specialist[] = [];
  public filteredSpecialists: Specialist[] = [];
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
  public editingSpecialist: Specialist | null = null;
  public specialistToChangeStatus: Specialist | null = null;
  public activeCenter: Center | null = null;
  public currentUser: CurrentUser | null = null;
  public readonly statusOptions: SpecialistStatus[] = [
    'ACTIVE',
    'INACTIVE',
    'VACATION',
  ];
  public selectedStatus: SpecialistStatus = 'ACTIVE';
  public form: SpecialistForm = this.getEmptyForm();
  private activeCenterSubscription?: Subscription;
  private currentUserSubscription?: Subscription;
  private loadedCenterId?: number | null;

  constructor(
    private readonly specialistsService: SpecialistsService,
    private readonly centersService: CentersService,
    private readonly activeCenterService: ActiveCenterService,
    private readonly authService: AuthService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.watchCurrentUser();
    this.loadCenters();
    this.activeCenterSubscription =
      this.activeCenterService.activeCenter$.subscribe(center => {
        const centerId = center?.id ?? null;

        if (centerId === this.loadedCenterId) return;

        this.activeCenter = center;
        this.loadedCenterId = centerId;
        this.loadSpecialists();
      });
  }

  ngOnDestroy(): void {
    this.activeCenterSubscription?.unsubscribe();
    this.currentUserSubscription?.unsubscribe();
  }

  public loadSpecialists(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) this.clearMessages();

    const request = this.showAll
      ? this.specialistsService.getAllSpecialists(this.activeCenter?.id)
      : this.specialistsService.getSpecialists(this.activeCenter?.id);

    request.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: specialists => {
        this.specialists = specialists;
        this.applySearch();
      },
      error: () => {
        this.errorMessage = this.translate('specialists.errors.load');
      },
    });
  }

  public toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.loadSpecialists();
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.editingSpecialist = null;
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public openEditModal(specialist: Specialist): void {
    this.clearMessages();
    this.editingSpecialist = specialist;
    this.form = {
      name: specialist.name,
      specialty: specialist.specialty ?? '',
      status: this.resolveStatus(specialist),
      centerId: specialist.center?.id ?? this.activeCenter?.id ?? null,
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveSpecialist(): void {
    if (!this.isFormValid()) {
      this.errorMessage = this.translate('specialists.errors.form');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    const payload = this.getPayload();
    const request = this.editingSpecialist
      ? this.specialistsService.updateSpecialist(
          this.editingSpecialist.id,
          payload
        )
      : this.specialistsService.createSpecialist(payload);

    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingSpecialist
          ? this.translate('specialists.success.updated')
          : this.translate('specialists.success.created');
        this.isFormModalOpen = false;
        this.loadSpecialists(false);
      },
      error: () => {
        this.errorMessage = this.translate('specialists.errors.save');
      },
    });
  }

  public openStatusModal(specialist: Specialist): void {
    this.clearMessages();
    this.specialistToChangeStatus = specialist;
    this.selectedStatus = this.resolveStatus(specialist);
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

  public changeSpecialistStatus(): void {
    if (!this.specialistToChangeStatus) return;

    const specialist = this.specialistToChangeStatus;

    if (this.resolveStatus(specialist) === this.selectedStatus) {
      this.isStatusModalOpen = false;
      this.specialistToChangeStatus = null;
      return;
    }

    this.isChangingStatus = true;
    this.clearMessages();

    const centerId = specialist.center?.id ?? this.activeCenter?.id;

    if (!centerId) {
      this.errorMessage = this.translate('specialists.errors.form');
      this.isChangingStatus = false;
      return;
    }

    const request = this.specialistsService.updateSpecialist(specialist.id, {
      name: specialist.name,
      specialty: specialist.specialty ?? null,
      status: this.selectedStatus,
      centerId,
    });

    request.pipe(finalize(() => (this.isChangingStatus = false))).subscribe({
      next: () => {
        this.successMessage = this.translate('specialists.success.updated');
        this.isStatusModalOpen = false;
        this.specialistToChangeStatus = null;
        this.loadSpecialists(false);
      },
      error: () => {
        this.errorMessage = this.translate('specialists.errors.status');
      },
    });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredSpecialists = search
      ? this.specialists.filter(specialist =>
          [
            specialist.id,
            specialist.name,
            specialist.specialty ?? '',
            this.specialistStatusLabel(specialist),
            specialist.center?.name ?? '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(search)
        )
      : [...this.specialists];
  }

  public statusBadgeClass(specialist: Specialist): string {
    const status = this.resolveStatus(specialist);

    if (status === 'ACTIVE')
      return 'badge-soft-success border-success text-success';

    if (status === 'VACATION')
      return 'badge-soft-warning border-warning text-warning';

    return 'badge-soft-danger border-danger text-danger';
  }

  public specialistStatusLabel(
    specialistOrStatus: Specialist | SpecialistStatus,
  ): string {
    const status =
      typeof specialistOrStatus === 'string'
        ? specialistOrStatus
        : this.resolveStatus(specialistOrStatus);

    return this.translate(`specialists.status.${status.toLowerCase()}`);
  }

  public trackBySpecialistId(_: number, specialist: Specialist): number {
    return specialist.id;
  }

  public get centerOptions(): Center[] {
    return this.withCurrentOption(
      this.centers,
      this.editingSpecialist?.center
    );
  }

  public get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  public get specialistTableColumnCount(): number {
    return this.isAdmin ? 6 : 5;
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
  }

  public centerName(specialist: Specialist): string {
    return specialist.center?.name ?? this.translate('centers.none');
  }

  public isFormValid(): boolean {
    return !!this.form.name.trim() && !!this.form.centerId && !!this.form.status;
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

  private getPayload(): SpecialistPayload {
    const specialty = this.form.specialty.trim();

    return {
      name: this.form.name.trim(),
      specialty: specialty || null,
      status: this.form.status,
      centerId: Number(this.form.centerId),
    };
  }

  private getEmptyForm(): SpecialistForm {
    return {
      name: '',
      specialty: '',
      status: 'ACTIVE',
      centerId: this.activeCenter?.id ?? null,
    };
  }

  private resolveStatus(specialist: Specialist): SpecialistStatus {
    return specialist.status ?? (specialist.active ? 'ACTIVE' : 'INACTIVE');
  }

  private withCurrentOption<T extends { id: number }>(
    options: T[],
    current?: T | null,
  ): T[] {
    if (!current || options.some(option => option.id === current.id))
      return options;

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
