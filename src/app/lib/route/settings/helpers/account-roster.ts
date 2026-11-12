import _ from 'lodash';
import type { AddressProbe } from '../../../jira-api.ts';
import type { AccountConfig, GeneralConfig, SettingsStore } from '../../../settings.ts';

export interface AccountCollection {
  invalid(list: AccountConfig[], selected: AccountConfig): boolean;
  normalized(list: AccountConfig[], selected: AccountConfig): AccountConfig[];
  persist(accounts: AccountConfig[], general: GeneralConfig): void;
  draft(list: AccountConfig[], label: string): AccountConfig | null;
}

/**
 * Validates, normalizes, and persists the list of JIRA accounts in settings.
 */
export class AccountRoster implements AccountCollection {
  private readonly settings: SettingsStore;
  private readonly probe: AddressProbe;

  constructor(settings: SettingsStore, probe: AddressProbe) {
    this.settings = settings;
    this.probe = probe;
    Object.freeze(this);
  }

  invalid(list: AccountConfig[], selected: AccountConfig): boolean {
    return list.some(item => {
      const account = selected.id === item.id ? selected : item;
      return !account.url || account.url.indexOf('http') !== 0;
    });
  }

  normalized(list: AccountConfig[], selected: AccountConfig): AccountConfig[] {
    return list.map(item => {
      const account = { ...(selected.id === item.id ? selected : item) };
      account.url = this.probe.normalize(account.url!);
      account.timeout = parseInt(String(account.timeout), 10) || 10;
      return account;
    });
  }

  persist(accounts: AccountConfig[], general: GeneralConfig): void {
    this.settings.accounts = accounts;
    this.settings.general = { ...this.settings.general, ...general };
    const ids = accounts.map(acc => acc.id);
    this.settings.activity = {
      ...this.settings.activity,
      workspace: _.pick(this.settings.activity.workspace, ids)
    };
    if (this.settings.colors.accounts) {
      this.settings.colors = {
        ...this.settings.colors,
        accounts: _.pick(this.settings.colors.accounts, ids)
      };
    }
  }

  draft(list: AccountConfig[], label: string): AccountConfig | null {
    if (!label.length) {
      return null;
    }
    const id = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    if (!id || list.some(acc => acc.id === id)) {
      return null;
    }
    return {
      ...this.settings.accounts[0],
      id,
      label,
      url: null,
      enabled: true
    };
  }
}
