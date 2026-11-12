import type { AccountConfig, SettingsStore } from '../../../lib/settings.ts';
import type { IssueSummary } from '../../../lib/timer.ts';

export interface BrowserLinks {
  detached(callback: (detached: boolean) => void): void;
  detach(alreadyDetached: boolean): void;
  settings(): void;
  feedback(): void;
  issue(account: AccountConfig | undefined, issue: IssueSummary): void;
}

/**
 * Opens extension settings, feedback, JIRA issue tabs, and detached popup windows.
 */
export class BoardNavigation implements BrowserLinks {
  private readonly store: SettingsStore;

  constructor(store: SettingsStore) {
    this.store = store;
    Object.freeze(this);
  }

  detached(callback: (detached: boolean) => void): void {
    if (typeof chrome !== 'undefined' && chrome.windows) {
      chrome.windows.getCurrent({}, win => callback(win.type === 'popup'));
    }
  }

  detach(alreadyDetached: boolean): void {
    if (alreadyDetached || typeof chrome === 'undefined' || !chrome.windows) {
      return;
    }
    const width = 1024;
    const height = 768;
    chrome.windows.create(
      {
        url: 'views/default.html',
        type: 'popup',
        width,
        height,
        left: Math.round((screen.availWidth - width) / 2),
        top: Math.round((screen.availHeight - height) / 2)
      },
      () => window.close()
    );
  }

  settings(): void {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ active: true, url: this.store.getUriSettings() });
    }
  }

  feedback(): void {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ active: true, url: this.store.getUriFeedback() });
    }
  }

  issue(account: AccountConfig | undefined, issue: IssueSummary): void {
    if (typeof chrome !== 'undefined' && chrome.tabs && account?.url) {
      chrome.tabs.create({
        active: false,
        url: [account.url, 'browse', issue.key].join('/')
      });
    }
  }
}
