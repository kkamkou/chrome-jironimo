import type { NotificationChannel } from '../../notifications.ts';
import type { SettingsStore } from '../../settings.ts';
import type { AccountCheck } from './account-audit.ts';

export interface IssueMonitor {
  poll(): Promise<void>;
}

/**
 * Polls watched JIRA workspaces and dispatches desktop notifications for externally updated issues.
 */
export class WorkspaceWatch implements IssueMonitor {
  private readonly settings: SettingsStore;
  private readonly notifications: NotificationChannel;
  private readonly audit: AccountCheck;

  constructor(
    settings: SettingsStore,
    notifications: NotificationChannel,
    audit: AccountCheck
  ) {
    this.settings = settings;
    this.notifications = notifications;
    this.audit = audit;
    Object.freeze(this);
  }

  poll(): Promise<void> {
    return this.audit.verified().then(accounts => {
      accounts.forEach(entry => {
        const seen = new Set<string>();
        this.settings.workspaces
          .filter(ws => ['ALL', entry.account.id].includes(ws.account) && ws.changesNotify)
          .forEach(workspace => {
            const interval = Number(this.settings.timer.workspace) || 5;
            const query = {
              jql: `updated > "-${interval}m" AND ${workspace.query ?? ''}`,
              expand: 'changelog',
              fields: 'updated,summary'
            };
            entry.api.search(query, (err, result) => {
              if (err || !result || !Array.isArray(result.issues)) {
                return;
              }
              result.issues.forEach((issue: any) => {
                if (seen.has(issue.id)) {
                  return;
                }
                seen.add(issue.id);
                const histories = issue?.changelog?.histories;
                const latest = Array.isArray(histories) ? histories[histories.length - 1] : null;
                if (
                  latest &&
                  ((entry.myself?.accountId &&
                    latest.author?.accountId === entry.myself.accountId) ||
                    (entry.myself?.name && latest.author?.name === entry.myself.name))
                ) {
                  return;
                }
                const updated = new Date(issue.fields.updated);
                const formatted = new Intl.DateTimeFormat(undefined, {
                  hour: 'numeric',
                  minute: '2-digit'
                }).format(updated);
                const iconUrl =
                  typeof chrome !== 'undefined' && chrome.runtime?.getURL
                    ? chrome.runtime.getURL('icons/app-128.png')
                    : 'icons/app-128.png';
                this.notifications.createOrUpdate(
                  ['issue', entry.account.id, issue.key].join(';'),
                  {
                    eventTime: updated.valueOf(),
                    iconUrl,
                    isClickable: true,
                    requireInteraction: Boolean(workspace.changesNotifyPersistent),
                    message: `${String(issue.fields.summary).trim()} (updated at ${formatted})`,
                    title: issue.key
                  }
                );
              });
            });
          });
      });
    });
  }
}
