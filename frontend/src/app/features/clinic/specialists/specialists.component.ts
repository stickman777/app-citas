import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { CrudFilterComponent } from '../../../common-component/crud-filter/crud-filter.component';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import { ActiveCenterService } from '../../../core/centers/active-center.service';
import { Center, CentersService } from '../../../core/centers/centers.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import {
  Specialist,
  SpecialistAbsence,
  SpecialistPayload,
  SpecialistStatus,
  SpecialistsService,
} from '../../../core/specialists/specialists.service';

type SpecialistStatusFilter = SpecialistStatus | 'all';

interface SpecialistForm {
  name: string;
  specialty: string;
  status: SpecialistStatus;
  centerId: number | null;
}

interface AbsenceForm {
  startDate: string;
  endDate: string;
  reason: string;
}

@Component({
  selector: 'app-specialists',
  templateUrl: './specialists.component.html',
  styleUrls: ['./specialists.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe, CrudFilterComponent],
})
export class SpecialistsComponent implements OnInit, OnDestroy {
  public specialists: Specialist[] = [];
  public filteredSpecialists: Specialist[] = [];
  public centers: Center[] = [];
  public searchTerm = '';
  public filterStatus: SpecialistStatusFilter = 'ACTIVE';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isChangingStatus = false;
  public isFormModalOpen = false;
  public isStatusModalOpen = false;
  public editingSpecialist: Specialist | null = null;
  public specialistToChangeStatus: Specialist | null = null;
  public activeCenter: Center | null = null;
  public currentUser: CurrentUser | null = null;
  public readonly statusOptions: SpecialistStatus[] = ['ACTIVE', 'INACTIVE'];
  public selectedStatus: SpecialistStatus = 'ACTIVE';
  public form: SpecialistForm = this.getEmptyForm();
  public isAbsenceModalOpen = false;
  public absenceSpecialist: Specialist | null = null;
  public absences: SpecialistAbsence[] = [];
  public isLoadingAbsences = false;
  public isSavingAbsence = false;
  public deletingAbsenceId: number | null = null;
  public absenceError = '';
  public absenceToastMessage = '';
  public absenceForm: AbsenceForm = this.getEmptyAbsenceForm();
  public readonly minAbsenceDate = this.toDateInputValue(new Date());
  private activeCenterSubscription?: Subscription;
  private currentUserSubscription?: Subscription;
  private loadedCenterId?: number | null;
  private absenceToastTimeout?: number;

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
    this.clearAbsenceToastTimeout();
  }

  public loadSpecialists(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) this.clearMessages();

    this.specialistsService
      .getAllSpecialists(this.activeCenter?.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: specialists => {
          this.specialists = specialists;
          this.applySearch();
        },
        error: () => {
          this.errorMessage = this.translate('specialists.errors.load');
        },
      });
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
    if (this.isAbsenceModalOpen) this.closeAbsenceModal();
  }

  public openAbsenceModal(specialist: Specialist): void {
    this.clearMessages();
    this.absenceSpecialist = specialist;
    this.absences = [];
    this.absenceForm = this.getEmptyAbsenceForm();
    this.absenceError = '';
    this.isAbsenceModalOpen = true;
    this.loadAbsences();
  }

  public closeAbsenceModal(): void {
    if (this.isSavingAbsence || this.deletingAbsenceId !== null) return;

    this.isAbsenceModalOpen = false;
    this.absenceSpecialist = null;
  }

  public loadAbsences(): void {
    if (!this.absenceSpecialist) return;

    this.isLoadingAbsences = true;

    this.specialistsService
      .listAbsences(this.absenceSpecialist.id)
      .pipe(finalize(() => (this.isLoadingAbsences = false)))
      .subscribe({
        next: absences => {
          this.absences = absences;
        },
        error: () => {
          this.absenceError = this.translate('specialists.absences.errors.load');
        },
      });
  }

  public addAbsence(): void {
    if (!this.absenceSpecialist) return;

    const { startDate, endDate } = this.absenceForm;

    if (!startDate || !endDate || endDate < startDate) {
      this.absenceError = this.translate('specialists.absences.errors.form');
      return;
    }

    this.isSavingAbsence = true;
    this.absenceError = '';

    this.specialistsService
      .createAbsence(this.absenceSpecialist.id, {
        startDate,
        endDate,
        reason: this.absenceForm.reason.trim() || null,
      })
      .pipe(finalize(() => (this.isSavingAbsence = false)))
      .subscribe({
        next: absence => {
          this.absences = [...this.absences, absence];
          this.absenceForm = this.getEmptyAbsenceForm();
        },
        error: () => {
          this.absenceError = this.translate('specialists.absences.errors.save');
        },
      });
  }

  public removeAbsence(absence: SpecialistAbsence): void {
    this.deletingAbsenceId = absence.id;
    this.absenceError = '';

    this.specialistsService
      .removeAbsence(absence.id)
      .pipe(finalize(() => (this.deletingAbsenceId = null)))
      .subscribe({
        next: () => {
          this.showAbsenceToast(
            this.translate('specialists.absences.success.deleted')
          );
          this.loadAbsences();
        },
        error: () => {
          this.absenceError = this.translate(
            'specialists.absences.errors.delete',
          );
        },
      });
  }

  public trackByAbsenceId(_: number, absence: SpecialistAbsence): number {
    return absence.id;
  }

  public formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    return `${day}/${month}/${year}`;
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

    this.filteredSpecialists = this.specialists.filter(specialist => {
      const matchesSearch =
        !search ||
        [
          specialist.id,
          specialist.name,
          specialist.specialty ?? '',
          this.specialistStatusLabel(specialist),
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
      const matchesStatus =
        this.filterStatus === 'all' ||
        this.resolveStatus(specialist) === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
  }

  public clearFilters(): void {
    this.filterStatus = 'all';
    this.applySearch();
  }

  public statusBadgeClass(specialist: Specialist): string {
    const status = this.resolveStatus(specialist);

    if (status === 'ACTIVE')
      return 'badge-soft-success border-success text-success';

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
    return 5;
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
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

  private getEmptyAbsenceForm(): AbsenceForm {
    return { startDate: '', endDate: '', reason: '' };
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private resolveStatus(specialist: Specialist): SpecialistStatus {
    return specialist.status;
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

  private showAbsenceToast(message: string): void {
    this.clearAbsenceToastTimeout();
    this.absenceToastMessage = message;

    this.absenceToastTimeout = window.setTimeout(() => {
      this.absenceToastMessage = '';
      this.absenceToastTimeout = undefined;
    }, 1500);
  }

  private clearAbsenceToastTimeout(): void {
    if (this.absenceToastTimeout === undefined) return;

    window.clearTimeout(this.absenceToastTimeout);
    this.absenceToastTimeout = undefined;
  }

  private translate(key: string): string {
    return this.i18nService.translate(key);
  }
}
