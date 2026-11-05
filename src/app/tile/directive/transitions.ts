import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { JiraClient } from '../../lib/adapter/jira.ts';
import type { IssueSummary } from '../../lib/timer.ts';

/**
 * Overlay menu executing JIRA workflow status transitions for a tile issue.
 */
@Component({
  selector: 'tile-transitions',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display: contents' },
  templateUrl: '../../../views/tile/transitions.html'
})
export class TileTransitionsComponent {
  @Input() api!: JiraClient;
  @Input() entry!: IssueSummary;
  @Input() visible = false;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly modified = new EventEmitter<IssueSummary>();

  close(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  modify(event: Event, entry: IssueSummary, transition: { id: string }): void {
    event.preventDefault();
    this.closed.emit();
    this.api.transitions(entry.id, { _method: 'POST', transition: { id: transition.id } }, err => {
      if (!err) {
        this.modified.emit(entry);
      }
    });
  }
}
