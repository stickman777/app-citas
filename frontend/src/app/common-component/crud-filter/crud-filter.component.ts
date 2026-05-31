import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Output } from '@angular/core';

import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-crud-filter',
  templateUrl: './crud-filter.component.html',
  styleUrls: ['./crud-filter.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class CrudFilterComponent {
  @Output() clearFilters = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<void>();

  public isOpen = false;

  @HostListener('document:click')
  public close(): void {
    this.isOpen = false;
  }

  public toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  public keepOpen(event: MouseEvent): void {
    event.stopPropagation();
  }

  public clear(event: MouseEvent): void {
    event.stopPropagation();
    this.clearFilters.emit();
  }

  public apply(event: MouseEvent): void {
    event.stopPropagation();
    this.applyFilters.emit();
    this.isOpen = false;
  }
}
