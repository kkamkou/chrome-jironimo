import type { AccountConfig, SettingsStore } from './settings-types.ts';

export interface StorageMigration {
  upgrade(settings: SettingsStore): void;
}

/**
 * Upgrades legacy pre-600 storage keys into the multi-account schema.
 */
export class SettingsMigration implements StorageMigration {
  private readonly store: Record<string, string>;

  constructor(store: Record<string, string>) {
    this.store = store;
    Object.freeze(this);
  }

  upgrade(settings: SettingsStore): void {
    if (settings.version >= 600) {
      return;
    }
    if (Array.isArray(settings.workspaces)) {
      settings.workspaces = settings.workspaces.map(workspace => ({
        ...workspace,
        account: 'ALL'
      }));
    }
    const base: AccountConfig = {
      enabled: true,
      id: 'default',
      label: 'Default',
      timeout: 10,
      type: 'basic',
      url: null
    };
    settings.accounts = [base];
    const current = settings.activity;
    current.workspace.default = {
      enabled: true,
      index: Number(this.store.workspaceLast) || 0,
      searchMaxResults: 16,
      timers: this.store.timers ? JSON.parse(this.store.timers) : {}
    };
    settings.activity = current;
    const legacy = this.store.account ? JSON.parse(this.store.account) : null;
    if (legacy && legacy.url) {
      settings.general = { sync: Boolean(legacy.sync) || true };
      settings.accounts = [{ ...base, url: legacy.url, timeout: Number(legacy.timeout) || 10 }];
    }
    delete this.store.workspaceLast;
    delete this.store.timers;
    delete this.store.account;
    settings.version = 600;
  }
}
