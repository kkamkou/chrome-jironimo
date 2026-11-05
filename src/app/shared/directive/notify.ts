import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, type DoCheck, Input, inject } from '@angular/core';

export interface NotificationEntry {
  type: 'success' | 'error' | 'notice';
  message: string;
}

/**
 * Displays transient notification banners and dismisses them after five seconds.
 */
@Component({
  selector: 'notify',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display: contents' },
  templateUrl: '../../../views/shared/notify.html'
})
export class NotifyComponent implements DoCheck {
  @Input() entries: NotificationEntry[] = [];
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly scheduled = new WeakSet<NotificationEntry>();

  ngDoCheck(): void {
    if (!Array.isArray(this.entries)) {
      return;
    }
    this.entries.forEach(entry => {
      if (this.scheduled.has(entry)) {
        return;
      }
      this.scheduled.add(entry);
      setTimeout(() => {
        const idx = this.entries.indexOf(entry);
        if (idx !== -1) {
          this.entries.splice(idx, 1);
          this.cdr.markForCheck();
        }
      }, 5000);
    });
  }
}
