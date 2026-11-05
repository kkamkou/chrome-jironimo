import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import type { JiraClient } from '../../lib/adapter/jira.ts';
import { Notifications } from '../../lib/notifications.ts';
import type { AccountConfig } from '../../lib/settings.ts';
import type { IssueSummary, WorklogTimer } from '../../lib/timer.ts';
import { I18nPipe } from '../../shared/filter/i18n.ts';

/**
 * Action toolbar for starting, stopping, or discarding an issue worklog timer and opening transitions.
 */
@Component({
  selector: 'tile-toolbar',
  standalone: true,
  imports: [CommonModule, I18nPipe],
  host: { style: 'display: contents' },
  templateUrl: '../../../views/tile/toolbar.html'
})
export class TileToolbarComponent {
  @Input() account!: AccountConfig;
  @Input() api!: JiraClient;
  @Input() entry!: IssueSummary;
  @Input() timer!: WorklogTimer;
  @Input() visible = false;
  @Output() readonly showTransitions = new EventEmitter<void>();
  @Output() readonly openIssue = new EventEmitter<IssueSummary>();
  @Output() readonly modified = new EventEmitter<IssueSummary>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notifications = new Notifications();
  private readonly i18n = new I18nPipe();

  timerStart(issue: IssueSummary): void {
    if (issue.fields?.assignee) {
      this.timer.start(issue);
      this.cdr.markForCheck();
      return;
    }
    this.api.myself((err1, info) => {
      if (err1 || !info) {
        return;
      }
      const notifyId = ['issue', this.account.id, issue.key].join(';');
      const paramsQuery = { _method: 'PUT', name: info.name };
      const notifyParams = {
        title: issue.key,
        message: this.i18n.transform('notificationAssignedToMe')
      };
      this.api.issueAssignee(issue.key ?? issue.id, paramsQuery, err2 => {
        if (err2) {
          return;
        }
        this.modified.emit(issue);
        this.notifications.createOrUpdate(notifyId, notifyParams, () => {
          this.timer.start(issue);
          this.cdr.markForCheck();
        });
      });
    });
  }
}
