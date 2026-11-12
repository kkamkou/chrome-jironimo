import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  type ElementRef,
  type OnDestroy,
  type OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import _ from 'lodash';
import { ButtonDirective } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { InputText } from 'primeng/inputtext';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Select } from 'primeng/select';
import type { JiraClient } from '../lib/adapter/jira.ts';
import { FetchTransport } from '../lib/http/fetch-transport.ts';
import { JiraRegistry } from '../lib/jira-api.ts';
import { type AccountConfig, Settings, type WorkspaceConfig } from '../lib/settings.ts';
import { type IssueSummary, TimerFactory, type WorklogTimer } from '../lib/timer.ts';
import { PaginationComponent } from '../shared/directive/pagination.ts';
import { I18nPipe } from '../shared/filter/i18n.ts';
import { TileComponent } from '../tile/directive/tile.ts';
import { BoardActivity } from './board/helpers/board-activity.ts';
import { IssueAppearance } from './board/helpers/issue-appearance.ts';
import { BoardNavigation } from './board/services/board-navigation.ts';
import { PagedSearch } from './board/services/paged-search.ts';

/**
 * Primary popup board displaying JIRA workspace issues as interactive tiles.
 */
@Component({
  selector: 'jironimo-index',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    ButtonGroup,
    InputText,
    ProgressSpinner,
    Select,
    I18nPipe,
    PaginationComponent,
    TileComponent
  ],
  templateUrl: '../../views/index.html'
})
export class IndexComponent implements OnInit, OnDestroy {
  @ViewChild('filterInput') filterInput?: ElementRef<HTMLInputElement>;
  readonly maxResultsOptions = [8, 16, 25, 50, 75, 100, 150, 250];
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly settings = new Settings();
  private readonly activity = new BoardActivity(this.settings);
  private readonly appearance = new IssueAppearance(this.settings);
  private readonly navigation = new BoardNavigation(this.settings);
  private readonly pager = new PagedSearch();
  private readonly i18n = new I18nPipe();
  private readonly jira = new JiraRegistry(
    cfg => new FetchTransport().send(cfg),
    key => this.i18n.transform(key),
    (status, messages) => {
      this.jiraRequestFailed = [_.capitalize(status), messages.join('; ')];
      this.loading = false;
      this.cdr.markForCheck();
    }
  );
  private readonly timerFactory = new TimerFactory(
    this.settings,
    undefined,
    issue => this.onTileModified(issue)
  );
  private refreshHandle: ReturnType<typeof setTimeout> | null = null;
  accounts: AccountConfig[] = this.settings.accounts.filter(acc => acc.enabled);
  account!: AccountConfig;
  workspaces: WorkspaceConfig[] = this.settings.workspaces;
  workspaceActive: WorkspaceConfig = this.settings.workspaces[0];
  issues: IssueSummary[] = [];
  issueFocused: IssueSummary | null = null;
  openToolbarIssueId: string | null = null;
  loading = false;
  searchMaxResults = 16;
  searchStartAt = 0;
  searchTotal = 0;
  windowDetached = false;
  filterFieldDisplay = false;
  filterText = '';
  homePanelVisible = false;
  jiraRequestFailed: [string, string] | null = null;
  api!: JiraClient;
  timer!: WorklogTimer;
  readonly refreshCallback = (offset: number, limit: number): void => {
    this.workspaceRefresh(offset, limit);
  };

  ngOnInit(): void {
    if (!this.accounts.length) {
      this.tabSettings();
      return;
    }
    this.navigation.detached(detached => {
      this.windowDetached = detached;
      this.cdr.markForCheck();
    });
    this.onAccountChange(this.activity.initialAccount(this.accounts));
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) {
      clearTimeout(this.refreshHandle);
    }
  }

  sortedAccounts(): AccountConfig[] {
    return [...this.accounts].sort((a, b) => a.label.localeCompare(b.label));
  }

  filteredIssues(): IssueSummary[] {
    const term = this.filterText.trim().toLowerCase();
    if (!term) {
      return this.issues;
    }
    return this.issues.filter(issue => JSON.stringify(issue).toLowerCase().includes(term));
  }

  onAccountChange(account: AccountConfig): void {
    if (!account) {
      return;
    }
    const selection = this.activity.activate(this.accounts, account);
    this.account = selection.account;
    this.workspaces = selection.workspaces;
    this.workspaceActive = selection.activeWorkspace;
    this.searchMaxResults = selection.maxResults;
    this.api = this.jira.instance(account);
    this.timer = this.timerFactory.instance(account, this.api);
    this.searchReset().workspaceRefresh();
  }

  onMaxResultsChange(limit: number): void {
    this.searchMaxResults = Number(limit) || 16;
    this.workspaceRefresh();
  }

  toggleFilterField(): void {
    this.filterFieldDisplay = !this.filterFieldDisplay;
    if (this.filterFieldDisplay) {
      this.homePanelVisible = false;
      setTimeout(() => this.filterInput?.nativeElement.focus(), 100);
    }
  }

  toggleHomePanel(): void {
    this.homePanelVisible = !this.homePanelVisible;
    if (this.homePanelVisible) {
      this.filterFieldDisplay = false;
    }
  }

  workspaceRefresh(offset?: number, limit?: number): void {
    if (!this.account || !this.workspaceActive) {
      return;
    }
    this.loading = true;
    this.jiraRequestFailed = null;
    this.filterFieldDisplay = false;
    this.homePanelVisible = false;
    this.openToolbarIssueId = null;
    this.issues = [];
    const actualOffset = offset === undefined ? this.searchStartAt : Number(offset);
    const actualLimit = limit === undefined ? this.searchMaxResults : Number(limit);
    const pageIndex = actualLimit > 0 ? Math.trunc(actualOffset / actualLimit) : 0;
    const isLastPageJump = this.searchTotal > 0 && actualOffset >= this.searchTotal - actualLimit;
    const jql = this.workspaceActive.query ?? '';
    this.pager
      .page(this.api, jql, actualLimit, pageIndex, this.searchTotal, isLastPageJump)
      .then(result => {
        this.loading = false;
        this.issues = (result.data.issues || []).map((issue: IssueSummary) =>
          this.appearance.apply(issue, this.account?.id)
        );
        this.searchStartAt = result.startAt;
        this.searchTotal = result.total;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
    this.activity.recordLimit(this.account.id, actualLimit);
    if (this.settings.timer.workspace > 0) {
      if (this.refreshHandle) {
        clearTimeout(this.refreshHandle);
      }
      this.refreshHandle = setTimeout(
        () => this.workspaceRefresh(actualOffset, actualLimit),
        (parseInt(String(this.settings.timer.workspace), 10) || 5) * 60000
      );
    }
  }

  workspaceSwitchTo(idx: number): void {
    const safeIdx = this.workspaces[idx] ? idx : 0;
    this.workspaceActive = this.workspaces[safeIdx];
    this.searchReset().workspaceRefresh();
    this.activity.recordWorkspace(this.account.id, safeIdx);
  }

  searchReset(): this {
    this.searchTotal = 0;
    this.searchStartAt = 0;
    this.pager.reset();
    return this;
  }

  windowDetach(): void {
    this.navigation.detach(this.windowDetached);
  }

  tabSettings(): void {
    this.navigation.settings();
  }

  tabFeedback(): void {
    this.navigation.feedback();
  }

  tabIssue(issue: IssueSummary): void {
    this.navigation.issue(this.account, issue);
  }

  onTileClick(event: MouseEvent, issue: IssueSummary): void {
    if (event.which === 2) {
      this.tabIssue(issue);
      return;
    }
    this.issueFocused = issue;
    this.openToolbarIssueId = this.openToolbarIssueId === issue.id ? null : issue.id;
  }

  onTileModified(entry: IssueSummary): void {
    this.pager.single(this.api, `id = ${entry.id}`, 1).then(data => {
      (data.issues || []).forEach((updated: IssueSummary) => {
        const idx = this.issues.findIndex(item => item.id === updated.id);
        if (idx !== -1) {
          this.issues[idx] = this.appearance.apply(updated, this.account?.id);
        }
      });
      this.cdr.markForCheck();
    });
  }
}
