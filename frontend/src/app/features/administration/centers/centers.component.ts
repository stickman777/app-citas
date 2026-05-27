import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  Center,
  CenterPayload,
  CentersService,
} from '../../../core/centers/centers.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

interface CenterForm {
  name: string;
  city: string;
  logoUrl: string;
}

@Component({
  selector: 'app-centers',
  templateUrl: './centers.component.html',
  styleUrls: ['./centers.component.scss'],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class CentersComponent {
  public centers: Center[] = [];
  public filteredCenters: Center[] = [];
  public searchTerm = '';
  public errorMessage = '';
  public successMessage = '';
  public isLoading = false;
  public isSaving = false;
  public isChangingStatus = false;
  public showAll = false;
  public isFormModalOpen = false;
  public isStatusModalOpen = false;
  public editingCenter: Center | null = null;
  public centerToChangeStatus: Center | null = null;
  public selectedStatus = true;
  public form: CenterForm = this.getEmptyForm();

  constructor(
    private readonly centersService: CentersService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadCenters();
  }

  public loadCenters(clearMessages = true): void {
    this.isLoading = true;

    if (clearMessages) {
      this.clearMessages();
    }

    const request = this.showAll
      ? this.centersService.getAllCenters()
      : this.centersService.getCenters();

    request.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: centers => {
        this.centers = centers;
        this.applySearch();
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.load');
      },
    });
  }

  public toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.loadCenters();
  }

  public openCreateModal(): void {
    this.clearMessages();
    this.editingCenter = null;
    this.form = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  public openEditModal(center: Center): void {
    this.clearMessages();
    this.editingCenter = center;
    this.form = {
      name: center.name,
      city: center.city ?? '',
      logoUrl: center.logoUrl ?? '',
    };
    this.isFormModalOpen = true;
  }

  public closeFormModal(): void {
    if (this.isSaving) return;

    this.isFormModalOpen = false;
  }

  public saveCenter(): void {
    if (!this.form.name.trim()) {
      this.errorMessage = this.translate('centers.errors.form');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    const request = this.editingCenter
      ? this.centersService.updateCenter(this.editingCenter.id, this.getPayload())
      : this.centersService.createCenter(this.getPayload());

    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingCenter
          ? this.translate('centers.success.updated')
          : this.translate('centers.success.created');
        this.isFormModalOpen = false;
        this.loadCenters(false);
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.save');
      },
    });
  }

  public openStatusModal(center: Center): void {
    this.clearMessages();
    this.centerToChangeStatus = center;
    this.selectedStatus = center.active;
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

  public changeCenterStatus(): void {
    if (!this.centerToChangeStatus) return;

    const center = this.centerToChangeStatus;

    if (center.active === this.selectedStatus) {
      this.isStatusModalOpen = false;
      this.centerToChangeStatus = null;
      return;
    }

    this.isChangingStatus = true;
    this.clearMessages();

    const request = this.selectedStatus
      ? this.centersService.activateCenter(center.id)
      : this.centersService.deactivateCenter(center.id);

    request.pipe(finalize(() => (this.isChangingStatus = false))).subscribe({
      next: () => {
        this.successMessage = this.selectedStatus
          ? this.translate('centers.success.activated')
          : this.translate('centers.success.deactivated');
        this.isStatusModalOpen = false;
        this.centerToChangeStatus = null;
        this.loadCenters(false);
      },
      error: () => {
        this.errorMessage = this.translate('centers.errors.status');
      },
    });
  }

  public applySearch(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredCenters = search
      ? this.centers.filter(center =>
          `${center.id} ${center.name} ${center.city ?? ''} ${center.logoUrl ?? ''}`
            .toLowerCase()
            .includes(search)
        )
      : [...this.centers];
  }

  public statusBadgeClass(center: Center): string {
    return center.active
      ? 'badge-soft-success border-success text-success'
      : 'badge-soft-danger border-danger text-danger';
  }

  public trackByCenterId(_: number, center: Center): number {
    return center.id;
  }

  private getPayload(): CenterPayload {
    const city = this.form.city.trim();
    const logoUrl = this.form.logoUrl.trim();

    return {
      name: this.form.name.trim(),
      city: city || null,
      logoUrl: logoUrl || null,
    };
  }

  private getEmptyForm(): CenterForm {
    return {
      name: '',
      city: '',
      logoUrl: '',
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
