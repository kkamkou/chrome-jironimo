import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import _ from 'lodash';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { Checkbox } from 'primeng/checkbox';
import { Divider } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { NavigationComponent } from '../../../shared/directive/navigation.ts';
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
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    ButtonGroup,
    Checkbox,
    Divider,
    InputText,
    Message,
    Tag,
    Textarea,
    I18nPipe,
    NavigationComponent
  ],
  templateUrl: '../../../../views/options-jql.html'
})
export class RouteSettingsWorkspace {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly settings = new Settings();
  private readonly i18n = new I18nPipe();
  private readonly jira = new JiraRegistry(
    cfg => new FetchTransport().send(cfg),
    key => this.i18n.transform(key)
  );
  private readonly statuses = new WeakMap<WorkspaceConfig, number>();
  private readonly debounced = _.debounce(
    (workspace: WorkspaceConfig) => this.verify(workspace),
    500
  );
  accounts: AccountConfig[] = this.settings.accounts.filter(acc => acc.enabled);
  accountSelected: AccountConfig | 'ALL' | '' = '';
  importingFavorites = false;
  workspaces: WorkspaceConfig[] = [];
  focusedWorkspace: WorkspaceConfig | null = null;
  readonly iconSuggestions = [
    'share-2',
    'target',
    'eye-2',
    'bug',
    'heart-2',
    'star',
    'flag',
    'fire',
    'rocket',
    'bookmark',
    'bell'
  ];

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
    this.debounced.cancel();
    this.accountSelected = target;
    this.workspaces = this.settings.workspaces
      .filter(ws => ws.account === this.accountId(target))
      .map(ws => ({ ...ws }));
    this.focusedWorkspace = null;
  }

  status(workspace: WorkspaceConfig): number {
    return this.statuses.get(workspace) ?? -1;
  }

  type(workspace: WorkspaceConfig): void {
    this.statuses.set(workspace, -1);
    this.debounced(workspace);
  }

  verify(workspace: WorkspaceConfig): Promise<boolean> {
    this.debounced.cancel();
    const query = String(workspace.query ?? '').trim();
    const account =
      this.accountSelected !== 'ALL' && this.accountSelected !== ''
        ? this.accountSelected
        : this.accounts[0];
    if (!query || !account) {
      this.statuses.set(workspace, 0);
      this.cdr.markForCheck();
      return Promise.resolve(false);
    }
    this.statuses.set(workspace, 2);
    this.cdr.markForCheck();
    return new Promise(resolve => {
      this.jira.instance(account).validateJql(query, err => {
        const valid = !err && String(workspace.query ?? '').trim() === query;
        if (String(workspace.query ?? '').trim() === query) {
          this.statuses.set(workspace, err ? 0 : 1);
          this.cdr.markForCheck();
        }
        resolve(valid);
      });
    });
  }

  add(): void {
    if (this.workspaces.length > 10 || this.accountSelected === '') {
      return;
    }
    const created: WorkspaceConfig = {
      account: this.accountId(this.accountSelected),
      title: null,
      query: null,
      icon: 'bug'
    };
    this.workspaces = [...this.workspaces, created];
    this.focusedWorkspace = created;
    this.cdr.markForCheck();
  }

  selectIcon(icon: string): void {
    if (this.focusedWorkspace) {
      this.focusedWorkspace.icon = icon;
      this.cdr.markForCheck();
    }
  }

  move(index: number, offset: number): void {
    this.workspaces = this.settings.moveWorkspace(this.workspaces, index, offset);
    this.cdr.markForCheck();
  }

  remove(workspace: WorkspaceConfig): boolean {
    if (!confirm(this.i18n.transform('msgGeneralActionConfirm'))) {
      return false;
    }
    if (this.workspaces.length < 2) {
      return false;
    }
    this.debounced.cancel();
    this.workspaces = this.workspaces.filter(ws => ws !== workspace);
    if (this.focusedWorkspace === workspace) {
      this.focusedWorkspace = null;
    }
    this.cdr.markForCheck();
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
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Jironimo', detail: String(err) });
        this.importingFavorites = false;
        this.cdr.markForCheck();
        return;
      }
      const imported = _.uniqBy(data, 'jql')
        .filter(fav => !this.workspaces.some(ws => ws.query === fav.jql))
        .map(fav => ({
          account: this.accountId(selected),
          icon: 'heart-2',
          query: fav.jql,
          title: fav.name
        }));
      if (imported.length) {
        this.workspaces = [...this.workspaces, ...imported];
      }
      this.importingFavorites = false;
      this.messageService.clear();
      this.messageService.add({
        severity: 'success',
        summary: 'Jironimo',
        detail: this.i18n.transform('msgWorkspaceImportSuccess', [imported.length])
      });
      this.cdr.markForCheck();
    });
  }

  isQueryValidForWatch(query: string | null): boolean {
    return /\bupdated(date)?\b/.test(String(query ?? '').toLowerCase());
  }

  async save(): Promise<void> {
    if (this.accountSelected === '') {
      return;
    }
    this.debounced.cancel();
    const results = await Promise.all(
      this.workspaces.map(ws => this.status(ws) === 1 || this.verify(ws))
    );
    if (!results.every(Boolean)) {
      this.messageService.clear();
      this.messageService.add({
        severity: 'error',
        summary: 'Jironimo',
        detail: this.i18n.transform('jiraApiCheckSettings')
      });
      this.cdr.markForCheck();
      return;
    }
    const id = this.accountId(this.accountSelected);
    this.settings.workspaces = this.settings.workspaces
      .filter(ws => ws.account !== id)
      .concat(this.workspaces.map(ws => ({ ...ws })));
    this.focusedWorkspace = null;
    this.messageService.clear();
    this.messageService.add({
      severity: 'success',
      summary: 'Jironimo',
      detail: this.i18n.transform('msgOptionsSaveSuccess')
    });
    this.cdr.markForCheck();
  }

  private accountId(account: AccountConfig | 'ALL'): string {
    return account === 'ALL' ? 'ALL' : account.id;
  }
}
