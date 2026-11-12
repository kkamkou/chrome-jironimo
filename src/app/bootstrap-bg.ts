import _ from 'lodash';
import { AccountAudit } from './lib/background/services/account-audit.ts';
import { NotificationAction } from './lib/background/services/notification-action.ts';
import { WorkspaceWatch } from './lib/background/services/workspace-watch.ts';
import { FetchTransport } from './lib/http/fetch-transport.ts';
import { type NotificationChannel, Notifications } from './lib/notifications.ts';
import { Settings, type SettingsStore } from './lib/settings.ts';
import { TimerFactory } from './lib/timer.ts';

export { AccountAudit, type AccountCheck, type VerifiedAccount } from './lib/background/services/account-audit.ts';
export { type AlertEvents, NotificationAction } from './lib/background/services/notification-action.ts';
export { type IssueMonitor, WorkspaceWatch } from './lib/background/services/workspace-watch.ts';

/**
 * Background daemon polling JIRA workspaces, dispatching desktop notifications, and updating the badge.
 */
export class BackgroundDaemon {
  private readonly settings: SettingsStore;
  private readonly notifications: NotificationChannel;
  private readonly transport: FetchTransport;

  constructor(
    settings: SettingsStore = new Settings(),
    notifications: NotificationChannel = new Notifications(),
    transport: FetchTransport = new FetchTransport()
  ) {
    this.settings = settings;
    this.notifications = notifications;
    this.transport = transport;
    Object.freeze(this);
  }

  start(): void {
    const action = new NotificationAction(this.settings, this.notifications);
    chrome.alarms.onAlarm.addListener(alarm => this.onStatusAlarm(alarm));
    chrome.alarms.onAlarm.addListener(alarm => this.onBadgeAlarm(alarm));
    chrome.notifications.onClicked.addListener(id => action.clicked(id));
    chrome.notifications.onButtonClicked.addListener(id => action.button(id));
    chrome.runtime.onInstalled.addListener(details => action.installed(details));
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local?.get(null, items => {
        if (items) {
          this.settings.setStorageData(items as Record<string, string>);
        }
        this.ensureAlarms(false);
      });
      chrome.storage.onChanged?.addListener(changes => {
        this.settings.setStorageData(
          _.mapValues(
            _.pickBy(changes, change => change.newValue !== undefined),
            change => String(change.newValue)
          )
        );
        if (changes.timer) {
          this.ensureAlarms(true);
        }
      });
      return;
    }
    this.ensureAlarms(false);
  }

  pollWorkspaces(): Promise<void> {
    const audit = new AccountAudit(this.settings, this.notifications, this.transport);
    return new WorkspaceWatch(this.settings, this.notifications, audit).poll();
  }

  private ensureAlarms(recreateStatus: boolean): void {
    chrome.alarms.get('jironimoRefreshIcon', alarm => {
      if (!alarm) {
        chrome.alarms.create('jironimoRefreshIcon', { periodInMinutes: 1 });
      }
    });
    chrome.alarms.get('jironimoStatusCheck', alarm => {
      if (!alarm || recreateStatus) {
        chrome.alarms.create('jironimoStatusCheck', {
          periodInMinutes: Number(this.settings.timer.workspace) || 5
        });
      }
    });
  }

  private onStatusAlarm(alarm?: chrome.alarms.Alarm): void {
    if (alarm && alarm.name === 'jironimoStatusCheck') {
      this.pollWorkspaces();
    }
  }

  private onBadgeAlarm(alarm?: chrome.alarms.Alarm): void {
    if (alarm && alarm.name === 'jironimoRefreshIcon') {
      new TimerFactory(this.settings).refreshBadge();
    }
  }
}

if (typeof chrome !== 'undefined' && chrome.alarms) {
  new BackgroundDaemon().start();
}
