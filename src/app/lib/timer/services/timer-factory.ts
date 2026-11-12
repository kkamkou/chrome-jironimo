import type { JiraClient } from '../../adapter/jira.ts';
import type { AccountConfig, SettingsStore } from '../../settings.ts';
import { BadgeState } from '../helpers/badge-state.ts';
import { AccountTimer, type IssueSummary, type WorklogTimer } from './account-timer.ts';

export interface TimerSource {
  instance(account: AccountConfig, api: JiraClient): WorklogTimer;
  refreshBadge(): void;
}

/**
 * Factory creating account-scoped WorklogTimer instances and refreshing the extension badge.
 */
export class TimerFactory implements TimerSource {
  private readonly settings: SettingsStore;
  private readonly badge: (text: string) => void;
  private readonly modified: (issue: IssueSummary) => void;

  constructor(
    settings: SettingsStore,
    badge: (text: string) => void = text => {
      const target =
        typeof chrome !== 'undefined' ? (chrome.action ?? chrome.browserAction) : undefined;
      if (target) {
        target.setBadgeText({ text });
      }
    },
    modified: (issue: IssueSummary) => void = () => undefined
  ) {
    this.settings = settings;
    this.badge = badge;
    this.modified = modified;
    Object.freeze(this);
  }

  instance(account: AccountConfig, api: JiraClient): WorklogTimer {
    return new AccountTimer(this.settings, account, api, {
      badge: this.badge,
      modified: this.modified
    });
  }

  refreshBadge(): void {
    this.badge(new BadgeState(this.settings).text());
  }
}
