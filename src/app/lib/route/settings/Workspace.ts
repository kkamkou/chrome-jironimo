import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationComponent } from '../../../shared/directive/navigation.ts';
import { type NotificationEntry, NotifyComponent } from '../../../shared/directive/notify.ts';
import { I18nPipe } from '../../../shared/filter/i18n.ts';
import { FetchTransport } from '../../http/fetch-transport.ts';
import { JiraRegistry } from '../../jira-api.ts';
import { type AccountConfig, Settings, type WorkspaceConfig } from '../../settings.ts';

/**
 * Workspace settings page managing JQL filter tabs and importing favorite JIRA filters.
 */
@Component({
  selector: 'jironimo-settings-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe, NavigationComponent, NotifyComponent],
  templateUrl: '../../../../views/options-jql.html'
})
export class RouteSettingsWorkspace {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly settings = new Settings();
  private readonly i18n = new I18nPipe();
  private readonly jira = new JiraRegistry(
    cfg => new FetchTransport().send(cfg),
    key => this.i18n.transform(key)
  );
  notifications: NotificationEntry[] = [];
  accounts: AccountConfig[] = this.settings.accounts.filter(acc => acc.enabled);
  accountSelected: AccountConfig | 'ALL' | '' = '';
  importingFavorites = false;
  workspaces: WorkspaceConfig[] = [];

  constructor() {
    this.accountSwitch('ALL');
  }

  accountSwitch(target: AccountConfig | 'ALL'): void {
    if (this.accountSelected === target) {
      return;
    }
    if (this.accountSelected !== '') {
      const saved = this.settings.workspaces.filter(
        ws => ws.account === this.accountId(this.accountSelected as AccountConfig | 'ALL')
      );
      if (
        JSON.stringify(saved) !== JSON.stringify(this.workspaces) &&
        !confirm('Your changes will be lost if you switch the tab now! Proceed?')
      ) {
        return;
      }
    }
    this.accountSelected = target;
    this.workspaces = this.settings.workspaces
      .filter(ws => ws.account === this.accountId(target))
      .map(ws => ({ ...ws }));
  }

  add(): void {
    if (this.workspaces.length > 10 || this.accountSelected === '') {
      return;
    }
    this.workspaces.push({
      account: this.accountId(this.accountSelected),
      title: null,
      query: null,
      icon: 'bug'
    });
  }

  remove(workspace: WorkspaceConfig): boolean {
    if (!confirm(this.i18n.transform('msgGeneralActionConfirm'))) {
      return false;
    }
    if (this.workspaces.length < 2) {
      return false;
    }
    this.workspaces = this.workspaces.filter(ws => ws !== workspace);
    return true;
  }

  import(): void {
    if (this.accountSelected === 'ALL' || this.accountSelected === '') {
      return;
    }
    this.importingFavorites = true;
    const selected = this.accountSelected;
    this.jira.instance(selected).filterFavourite((err, data: Array<{ jql: string; name: string }> = []) => {
      if (err) {
        this.notifications.push({ type: 'error', message: String(err) });
        this.importingFavorites = false;
        this.cdr.markForCheck();
        return;
      }
      const existing = new Set(this.workspaces.map(ws => ws.query));
      let count = 0;
      data.forEach(fav => {
        if (!existing.has(fav.jql)) {
          existing.add(fav.jql);
          count += 1;
          this.workspaces.push({
            account: this.accountId(selected),
            icon: 'heart-2',
            query: fav.jql,
            title: fav.name
          });
        }
      });
      this.importingFavorites = false;
      this.notifications.push({
        type: 'success',
        message: this.i18n.transform('msgWorkspaceImportSuccess', [count])
      });
      this.cdr.markForCheck();
    });
  }

  isQueryValidForWatch(query: string | null): boolean {
    return /\bupdated(date)?\b/.test(String(query ?? '').toLowerCase());
  }

  save(): void {
    if (this.accountSelected === '') {
      return;
    }
    const id = this.accountId(this.accountSelected);
    this.settings.workspaces = this.settings.workspaces
      .filter(ws => ws.account !== id)
      .concat(this.workspaces);
    this.notifications.push({
      type: 'success',
      message: this.i18n.transform('msgOptionsSaveSuccess')
    });
  }

  private accountId(account: AccountConfig | 'ALL'): string {
    return account === 'ALL' ? 'ALL' : account.id;
  }
}
