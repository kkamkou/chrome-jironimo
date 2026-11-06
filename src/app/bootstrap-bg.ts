import { Jira, type JiraClient } from './lib/adapter/jira.ts';
import { FetchTransport } from './lib/http/fetch-transport.ts';
import { Request } from './lib/http/request.ts';
import { type NotificationChannel, Notifications } from './lib/notifications.ts';
import { type AccountConfig, Settings, type SettingsStore } from './lib/settings.ts';
import { TimerFactory } from './lib/timer.ts';

interface VerifiedAccount {
  problem: boolean;
  account: AccountConfig;
  api: JiraClient;
  myself: { active?: boolean; name?: string; accountId?: string } | undefined;
}

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
    chrome.alarms.onAlarm.addListener(alarm => this.onStatusAlarm(alarm));
    chrome.alarms.onAlarm.addListener(alarm => this.onBadgeAlarm(alarm));
    chrome.notifications.onClicked.addListener(id => this.onNotificationClicked(id));
    chrome.notifications.onButtonClicked.addListener(id => this.onNotificationButton(id));
    chrome.runtime.onInstalled.addListener(details => this.onInstalled(details));
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local?.get(null, items => {
        if (items) {
          this.settings.setStorageData(items as Record<string, string>);
        }
        this.ensureAlarms(false);
      });
      chrome.storage.onChanged?.addListener(changes => {
        const updated: Record<string, string> = {};
        Object.keys(changes).forEach(key => {
          if (changes[key].newValue !== undefined) {
            updated[key] = String(changes[key].newValue);
          }
        });
        this.settings.setStorageData(updated);
        if (changes.timer) {
          this.ensureAlarms(true);
        }
      });
      return;
    }
    this.ensureAlarms(false);
  }

  pollWorkspaces(): Promise<void> {
    return this.accounts().then(accounts => {
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
                  ((entry.myself?.accountId && latest.author?.accountId === entry.myself.accountId) ||
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

  private accounts(): Promise<VerifiedAccount[]> {
    const checks = this.settings.accounts
      .filter(account => account.enabled)
      .map(
        account =>
          new Promise<VerifiedAccount>(resolve => {
            const api = new Jira(
              new Request(cfg => this.transport.send(cfg)),
              account.url,
              account.timeout * 1000
            );
            api.myself((err, myself) =>
              resolve({
                problem: err?.code === 401 || Boolean(myself && !myself.active),
                account,
                api,
                myself
              })
            );
          })
      );
    return Promise.all(checks).then(entries => {
      const valid: VerifiedAccount[] = [];
      entries.forEach(entry => {
        if (!entry.problem) {
          valid.push(entry);
          return;
        }
        const contactIcon =
          typeof chrome !== 'undefined' && chrome.runtime?.getURL
            ? chrome.runtime.getURL('icons/contact-128.png')
            : 'icons/contact-128.png';
        const cancelIcon =
          typeof chrome !== 'undefined' && chrome.runtime?.getURL
            ? chrome.runtime.getURL('icons/cancel-32.png')
            : 'icons/cancel-32.png';
        this.notifications.createOrUpdate(`auth;${entry.account.id}`, {
          title: 'Unauthorized',
          isClickable: true,
          message: `Please, authorize the "${entry.account.label}" account!`,
          priority: 2,
          requireInteraction: true,
          iconUrl: contactIcon,
          buttons: [
            {
              title: 'Disable account',
              iconUrl: cancelIcon
            }
          ]
        });
      });
      return valid;
    });
  }

  private onStatusAlarm(alarm?: chrome.alarms.Alarm): void {
    if (!alarm || alarm.name !== 'jironimoStatusCheck') {
      return;
    }
    this.pollWorkspaces();
  }

  private onBadgeAlarm(alarm?: chrome.alarms.Alarm): void {
    if (!alarm || alarm.name !== 'jironimoRefreshIcon') {
      return;
    }
    new TimerFactory(this.settings).refreshBadge();
  }

  private onNotificationClicked(nId: string): void {
    this.notifications.clear(nId, err => {
      if (err) {
        return;
      }
      if (nId === 'jironimo-update') {
        chrome.tabs.create({ active: true, url: this.settings.getUriSettings() });
        return;
      }
      const parts = nId.split(';');
      const target = this.settings.accounts.find(acc => acc.id === parts[1]);
      if (parts[0] === 'auth' && target?.url) {
        chrome.tabs.create({ active: true, url: target.url });
        return;
      }
      if (parts[0] === 'issue' && target?.url) {
        chrome.tabs.create({ active: true, url: `${target.url}/browse/${parts[2]}` });
        return;
      }
      console.error(`Unknown notification subtype "${parts[0]}"`);
    });
  }

  private onNotificationButton(nId: string): void {
    if (nId === 'jironimo-update') {
      chrome.tabs.create({ active: true, url: 'http://2ka.by/article/chrome-jironimo#changelog' });
      return;
    }
    const parts = nId.split(';');
    if (parts[0] === 'auth') {
      this.settings.accounts = this.settings.accounts.map(acc =>
        acc.id === parts[1] ? { ...acc, enabled: false } : acc
      );
      this.notifications.clear(nId);
    }
  }

  private onInstalled(details: chrome.runtime.InstalledDetails): void {
    if (details.reason === 'install') {
      chrome.tabs.create({ active: true, url: this.settings.getUriSettings() });
      chrome.runtime.setUninstallURL(this.settings.getUriFeedback());
      return;
    }
    if (details.reason === 'update') {
      this.notifications.createOrUpdate('jironimo-update', {
        buttons: [
          {
            title: 'Changelog',
            iconUrl: chrome.runtime.getURL('icons/eye-32.png')
          }
        ],
        title: chrome.i18n.getMessage('messageJironimoUpdatedTitle'),
        message: chrome.i18n.getMessage('messageJironimoUpdatedText')
      });
    }
  }
}

if (typeof chrome !== 'undefined' && chrome.alarms) {
  new BackgroundDaemon().start();
}
