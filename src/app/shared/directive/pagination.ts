import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { I18nPipe } from '../filter/i18n.ts';
import { PaginationSlice } from './pagination-slice.ts';

/**
 * Renders pagination controls for navigating paged JIRA issue results.
 */
@Component({
  selector: 'pagination',
  standalone: true,
  imports: [CommonModule, ButtonDirective, ButtonGroup, I18nPipe],
  host: { style: 'display: contents' },
  templateUrl: '../../../views/shared/pagination.html'
})
export class PaginationComponent {
  @Input() position = 0;
  @Input() limit = 16;
  @Input() total = 0;
  @Input() callback: (offset: number, limit: number) => void = () => undefined;

  hasPrev(): boolean {
    return this.slice().summary().hasPrev;
  }

  hasNext(): boolean {
    return this.slice().summary().hasNext;
  }

  first(): void {
    this.callback(this.slice().firstOffset(), this.limit);
  }

  prev(): void {
    this.callback(this.slice().prevOffset(), this.limit);
  }

  next(): void {
    this.callback(this.slice().nextOffset(), this.limit);
  }

  last(): void {
    this.callback(this.slice().lastOffset(), this.limit);
  }

  private slice(): PaginationSlice {
    return new PaginationSlice(this.position, this.limit, this.total);
  }
}
