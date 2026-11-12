import type { AccountConfig, SettingsStore, WorkspaceConfig } from '../../../settings.ts';

export interface WorkspaceCatalog {
  accountId(account: AccountConfig | 'ALL'): string;
  forAccount(account: AccountConfig | 'ALL'): WorkspaceConfig[];
  dirty(account: AccountConfig | 'ALL', current: WorkspaceConfig[]): boolean;
  blank(account: AccountConfig | 'ALL'): WorkspaceConfig;
  commit(account: AccountConfig | 'ALL', current: WorkspaceConfig[]): void;
}

/**
 * Manages account-scoped workspace tab lists, dirty checks, and persistence.
 */
export class WorkspaceDraft implements WorkspaceCatalog {
  private readonly settings: SettingsStore;

  constructor(settings: SettingsStore) {
    this.settings = settings;
    Object.freeze(this);
  }

  accountId(account: AccountConfig | 'ALL'): string {
    return account === 'ALL' ? 'ALL' : account.id;
  }

  forAccount(account: AccountConfig | 'ALL'): WorkspaceConfig[] {
    const id = this.accountId(account);
    return this.settings.workspaces.filter(ws => ws.account === id).map(ws => ({ ...ws }));
  }

  dirty(account: AccountConfig | 'ALL', current: WorkspaceConfig[]): boolean {
    const id = this.accountId(account);
    const saved = this.settings.workspaces.filter(ws => ws.account === id);
    return JSON.stringify(saved) !== JSON.stringify(current);
  }

  blank(account: AccountConfig | 'ALL'): WorkspaceConfig {
    return {
      account: this.accountId(account),
      title: null,
      query: null,
      icon: 'bug'
    };
  }

  commit(account: AccountConfig | 'ALL', current: WorkspaceConfig[]): void {
    const id = this.accountId(account);
    this.settings.workspaces = this.settings.workspaces
      .filter(ws => ws.account !== id)
      .concat(current.map(ws => ({ ...ws })));
  }
}
