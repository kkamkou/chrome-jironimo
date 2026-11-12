import type { SettingsStore } from '../../../lib/settings.ts';
import type { IssueSummary } from '../../../lib/timer.ts';
import { Duration } from '../../../lib/timer/duration.ts';

export interface IssueStyle {
  apply(issue: IssueSummary, accountId?: string): IssueSummary;
}

/**
 * Decorates a JIRA issue summary with tile priority colors, closed state, size class, and humanized estimate.
 */
export class IssueAppearance implements IssueStyle {
  private readonly settings: SettingsStore;

  constructor(settings: SettingsStore) {
    this.settings = settings;
    Object.freeze(this);
  }

  apply(issue: IssueSummary, accountId?: string): IssueSummary {
    const colors = this.settings.colors;
    issue._isClosed = issue.fields?.status?.name === 'Closed';
    issue._colors = colors.priority[0] ?? { fg: 'white', bg: 'gray', bd: 'white', ot: 'gray' };
    if (issue.fields?.timeestimate) {
      issue.fields.timeestimate = new Duration(
        Number(issue.fields.timeestimate) * 1000
      ).humanize();
    }
    const typeName = String(issue.fields?.issuetype?.name ?? '').toLowerCase();
    issue._size = colors.sizes[typeName] || colors.sizes.task;
    const priorityId = String(issue.fields?.priority?.id ?? '');
    const accountPriority =
      priorityId && accountId ? colors.accounts?.[accountId]?.[priorityId] : undefined;
    if (accountPriority) {
      issue._colors = accountPriority;
    } else if (priorityId && colors.priority[priorityId]) {
      issue._colors = colors.priority[priorityId];
    }
    return issue;
  }
}
