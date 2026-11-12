import type { AccountConfig, SettingsStore, WorkspaceConfig } from '../../../lib/settings.ts';

export interface AccountSelection {
  account: AccountConfig;
  workspaces: WorkspaceConfig[];
  activeWorkspace: WorkspaceConfig;
  maxResults: number;
}

export interface ActivityState {
  initialAccount(accounts: AccountConfig[]): AccountConfig;
  activate(accounts: AccountConfig[], account: AccountConfig): AccountSelection;
  recordLimit(accountId: string, limit: number): void;
  recordWorkspace(accountId: string, index: number): void;
}

/**
 * Tracks active account, active workspace index, and page size in persistent activity settings.
 */
export class BoardActivity implements ActivityState {
  private readonly settings: SettingsStore;

  constructor(settings: SettingsStore) {
    this.settings = settings;
    Object.freeze(this);
  }

  initialAccount(accounts: AccountConfig[]): AccountConfig {
    const lastIdx = this.settings.activity.lastAccount ?? 0;
    return accounts[lastIdx] || accounts[0];
  }

  activate(accounts: AccountConfig[], account: AccountConfig): AccountSelection {
    const idx = accounts.findIndex(item => item.id === account.id);
    if (this.settings.activity.lastAccount !== idx && idx !== -1) {
      this.settings.activity = { ...this.settings.activity, lastAccount: idx };
    }
    const workspaces = this.settings.workspaces.filter(ws =>
      ['ALL', account.id].includes(ws.account)
    );
    const activeIdx = this.settings.activity.workspace[account.id]?.index ?? 0;
    const activeWorkspace = workspaces[workspaces.length - 1 >= activeIdx ? activeIdx : 0];
    const maxResults = this.settings.activity.workspace[account.id]?.searchMaxResults ?? 16;
    return { account, workspaces, activeWorkspace, maxResults };
  }

  recordLimit(accountId: string, limit: number): void {
    const current = this.settings.activity.workspace[accountId] ?? {
      index: 0,
      searchMaxResults: 16,
      timers: {}
    };
    if (current.searchMaxResults !== limit) {
      const activity = this.settings.activity;
      activity.workspace[accountId] = { ...current, searchMaxResults: limit };
      this.settings.activity = activity;
    }
  }

  recordWorkspace(accountId: string, index: number): void {
    const current = this.settings.activity.workspace[accountId] ?? {
      index: 0,
      searchMaxResults: 16,
      timers: {}
    };
    if (current.index !== index) {
      const activity = this.settings.activity;
      activity.workspace[accountId] = { ...current, index };
      this.settings.activity = activity;
    }
  }
}
