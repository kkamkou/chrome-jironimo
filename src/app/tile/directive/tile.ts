import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { JiraClient } from '../../lib/adapter/jira.ts';
import type { AccountConfig } from '../../lib/settings.ts';
import type { IssueSummary, WorklogTimer } from '../../lib/timer.ts';
import { TileProgressComponent } from './progress.ts';
import { TileToolbarComponent } from './toolbar.ts';
import { TileTransitionsComponent } from './transitions.ts';

/**
 * Board tile card rendering an Issue with priority styling, progress, toolbar, and workflow transitions.
 */
@Component({
  selector: 'tile',
  standalone: true,
  imports: [CommonModule, TileProgressComponent, TileToolbarComponent, TileTransitionsComponent],
  host: { style: 'display: contents' },
  templateUrl: '../../../views/tile/tile.html'
})
export class TileComponent {
  @Input() account!: AccountConfig;
  @Input() api!: JiraClient;
  @Input() entry!: IssueSummary;
  @Input() timer!: WorklogTimer;
  @Output() readonly selectTile = new EventEmitter<MouseEvent>();
  @Output() readonly openIssue = new EventEmitter<IssueSummary>();
  @Output() readonly modified = new EventEmitter<IssueSummary>();
  transitionsOpen = false;
  private isToolbarOpen = false;

  @Input()
  get toolbarOpen(): boolean {
    return this.isToolbarOpen;
  }

  set toolbarOpen(value: boolean) {
    this.isToolbarOpen = value;
    if (!value) {
      this.transitionsOpen = false;
    }
  }
}
