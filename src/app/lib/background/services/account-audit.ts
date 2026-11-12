import { Jira, type JiraClient } from '../../adapter/jira.ts';
import type { FetchTransport } from '../../http/fetch-transport.ts';
import { Request } from '../../http/request.ts';
import type { NotificationChannel } from '../../notifications.ts';
import type { AccountConfig, SettingsStore } from '../../settings.ts';

export interface VerifiedAccount {
  problem: boolean;
  account: AccountConfig;
  api: JiraClient;
  myself: { active?: boolean; name?: string; accountId?: string } | undefined;
}

export interface AccountCheck {
  verified(): Promise<VerifiedAccount[]>;
}

/**
 * Verifies enabled JIRA accounts and dispatches authorization notifications when credentials fail.
 */
export class AccountAudit implements AccountCheck {
  private readonly settings: SettingsStore;
  private readonly notifications: NotificationChannel;
  private readonly transport: FetchTransport;

  constructor(
    settings: SettingsStore,
    notifications: NotificationChannel,
    transport: FetchTransport
  ) {
    this.settings = settings;
    this.notifications = notifications;
    this.transport = transport;
    Object.freeze(this);
  }

  verified(): Promise<VerifiedAccount[]> {
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
}
