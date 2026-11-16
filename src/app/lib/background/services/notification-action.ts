import type { NotificationChannel } from '../../notifications.ts';
import type { SettingsStore } from '../../settings.ts';

export interface AlertEvents {
  clicked(id: string): void;
  button(id: string): void;
  installed(details: chrome.runtime.InstalledDetails): void;
}

/**
 * Routes desktop notification clicks, action buttons, and extension install events.
 */
export class NotificationAction implements AlertEvents {
  private readonly settings: SettingsStore;
  private readonly notifications: NotificationChannel;

  constructor(settings: SettingsStore, notifications: NotificationChannel) {
    this.settings = settings;
    this.notifications = notifications;
    Object.freeze(this);
  }

  clicked(id: string): void {
    this.notifications.clear(id, () => {
      this.hydrate(() => {
        const parts = id.split(';');
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
    });
  }

  button(id: string): void {
    this.hydrate(() => {
      const parts = id.split(';');
      if (parts[0] === 'auth') {
        this.settings.accounts = this.settings.accounts.map(acc =>
          acc.id === parts[1] ? { ...acc, enabled: false } : acc
        );
        this.notifications.clear(id);
      }
    });
  }

  installed(details: chrome.runtime.InstalledDetails): void {
    if (details.reason === 'install') {
      chrome.tabs.create({ active: true, url: this.settings.getUriSettings() });
      chrome.runtime.setUninstallURL(this.settings.getUriFeedback());
      return;
    }
    if (details.reason === 'update') {
      this.hydrate(() => {
        this.settings.activity = { ...this.settings.activity, updateHint: true };
      });
    }
  }

  private hydrate(done: () => void): void {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(null, items => {
        if (items) {
          this.settings.setStorageData(items as Record<string, string>);
        }
        done();
      });
      return;
    }
    done();
  }
}
