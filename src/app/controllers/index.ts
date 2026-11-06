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
import { Duration } from '../lib/timer/duration.ts';
import { PaginationComponent } from '../shared/directive/pagination.ts';
import { I18nPipe } from '../shared/filter/i18n.ts';
import { TileComponent } from '../tile/directive/tile.ts';

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
  private readonly i18n = new I18nPipe();
  private readonly jira = new JiraRegistry(
    cfg => new FetchTransport().send(cfg),
    key => this.i18n.transform(key),
    (status, messages) => {
      const cap = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';
      this.jiraRequestFailed = [cap, messages.join('; ')];
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
  private pageTokens: Array<string | undefined> = [undefined];
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
    if (typeof chrome !== 'undefined' && chrome.windows) {
      chrome.windows.getCurrent({}, win => {
        this.windowDetached = win.type === 'popup';
        this.cdr.markForCheck();
      });
    }
    const lastIdx = this.settings.activity.lastAccount ?? 0;
    this.onAccountChange(this.accounts[lastIdx] || this.accounts[0]);
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
    this.account = account;
    const idx = this.accounts.findIndex(item => item.id === account.id);
    if (this.settings.activity.lastAccount !== idx && idx !== -1) {
      this.settings.activity = { ...this.settings.activity, lastAccount: idx };
    }
    this.workspaces = this.settings.workspaces.filter(ws =>
      ['ALL', account.id].includes(ws.account)
    );
    const activeIdx = this.settings.activity.workspace[account.id]?.index ?? 0;
    this.workspaceActive =
      this.workspaces[this.workspaces.length - 1 >= activeIdx ? activeIdx : 0];
    this.searchMaxResults =
      this.settings.activity.workspace[account.id]?.searchMaxResults ?? 16;
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
    this.resolveTargetPage(jql, actualLimit, pageIndex, isLastPageJump)
      .then(result => {
        this.loading = false;
        const list = (result.data.issues || []).map((issue: IssueSummary) =>
          this.issueModify(issue)
        );
        this.issues = list;
        const resolvedOffset = result.page * actualLimit;
        this.searchStartAt = result.data.startAt ?? resolvedOffset;
        if (typeof result.data.total === 'number') {
          this.searchTotal = result.data.total;
        } else if (!result.data.nextPageToken) {
          this.searchTotal = resolvedOffset + list.length;
        } else if (typeof result.approxCount === 'number' && result.approxCount > 0) {
          this.searchTotal = Math.max(result.approxCount, resolvedOffset + actualLimit + 1);
        } else {
          this.searchTotal = Math.max(
            this.searchTotal,
            resolvedOffset + actualLimit + list.length
          );
        }
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
    const currentWs = this.settings.activity.workspace[this.account.id] ?? {
      index: 0,
      searchMaxResults: 16,
      timers: {}
    };
    if (currentWs.searchMaxResults !== actualLimit) {
      const activity = this.settings.activity;
      activity.workspace[this.account.id] = { ...currentWs, searchMaxResults: actualLimit };
      this.settings.activity = activity;
    }
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
    const currentWs = this.settings.activity.workspace[this.account.id] ?? {
      index: 0,
      searchMaxResults: 16,
      timers: {}
    };
    if (currentWs.index !== safeIdx) {
      const activity = this.settings.activity;
      activity.workspace[this.account.id] = { ...currentWs, index: safeIdx };
      this.settings.activity = activity;
    }
  }

  searchReset(): this {
    this.searchTotal = 0;
    this.searchStartAt = 0;
    this.pageTokens = [undefined];
    return this;
  }

  windowDetach(): void {
    if (this.windowDetached || typeof chrome === 'undefined' || !chrome.windows) {
      return;
    }
    const w = 1024;
    const h = 768;
    chrome.windows.create(
      {
        url: 'views/default.html',
        type: 'popup',
        width: w,
        height: h,
        left: Math.round((screen.availWidth - w) / 2),
        top: Math.round((screen.availHeight - h) / 2)
      },
      () => window.close()
    );
  }

  tabSettings(): void {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ active: true, url: this.settings.getUriSettings() });
    }
  }

  tabFeedback(): void {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ active: true, url: this.settings.getUriFeedback() });
    }
  }

  tabIssue(issue: IssueSummary): void {
    if (typeof chrome !== 'undefined' && chrome.tabs && this.account?.url) {
      chrome.tabs.create({
        active: false,
        url: [this.account.url, 'browse', issue.key].join('/')
      });
    }
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
    this.issueSearch(`id = ${entry.id}`, 1).then(data => {
      (data.issues || []).forEach((updated: IssueSummary) => {
        const idx = this.issues.findIndex(item => item.id === updated.id);
        if (idx !== -1) {
          this.issues[idx] = this.issueModify(updated);
        }
      });
      this.cdr.markForCheck();
    });
  }

  private issueModify(issue: IssueSummary): IssueSummary {
    const colors = this.settings.colors;
    issue._isClosed = issue.fields?.status?.name === 'Closed';
    issue._colors = colors.priority[0] ?? { fg: 'white', bg: 'gray', bd: 'white', ot: 'gray' };
    if (issue.fields?.timeestimate) {
      issue.fields.timeestimate = new Duration(Number(issue.fields.timeestimate) * 1000).humanize();
    }
    const typeName = String(issue.fields?.issuetype?.name ?? '').toLowerCase();
    issue._size = colors.sizes[typeName] || colors.sizes.task;
    const priorityId = Number(issue.fields?.priority?.id);
    if (priorityId && colors.priority[priorityId]) {
      issue._colors = colors.priority[priorityId];
    }
    return issue;
  }

  private async resolveTargetPage(
    jql: string,
    limit: number,
    targetPage: number,
    jumpToEnd: boolean
  ): Promise<{ page: number; data: any; approxCount?: number }> {
    await this.ensureMyself();
    const countPromise =
      targetPage === 0 && this.searchTotal === 0
        ? this.fetchApproximateCount(jql)
        : Promise.resolve(undefined);
    let step = targetPage;
    while (step > 0 && !this.pageTokens[step]) {
      step -= 1;
    }
    while (step < targetPage) {
      const cursorData = await this.searchPage(jql, limit, this.pageTokens[step], true);
      if (!cursorData.nextPageToken) {
        targetPage = step;
        break;
      }
      this.pageTokens[step + 1] = cursorData.nextPageToken;
      step += 1;
    }
    let data = await this.searchPage(jql, limit, this.pageTokens[step], false);
    if (data.nextPageToken) {
      this.pageTokens[step + 1] = data.nextPageToken;
    }
    while (jumpToEnd && data.nextPageToken) {
      step += 1;
      data = await this.searchPage(jql, limit, this.pageTokens[step], false);
      if (data.nextPageToken) {
        this.pageTokens[step + 1] = data.nextPageToken;
      }
    }
    const approxCount = await countPromise;
    return { page: step, data, approxCount };
  }

  private issueSearch(jql: string, limit: number, nextPageToken?: string): Promise<any> {
    return this.ensureMyself().then(() => this.searchPage(jql, limit, nextPageToken, false));
  }

  private ensureMyself(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.myself((err, flag) => {
        if (err || !flag) {
          reject(err || new Error('Unable to identify myself'));
          return;
        }
        resolve();
      });
    });
  }

  private searchPage(
    jql: string,
    limit: number,
    nextPageToken: string | undefined,
    idsOnly: boolean
  ): Promise<any> {
    const query: Record<string, unknown> = {
      jql,
      maxResults: Number(limit) || 10,
      fields: idsOnly ? 'id' : '*navigable'
    };
    if (!idsOnly) {
      query.expand = 'transitions';
    }
    if (nextPageToken) {
      query.nextPageToken = nextPageToken;
    }
    return new Promise((resolve, reject) => {
      this.api.search(query, (err, data) => (err ? reject(err) : resolve(data)));
    });
  }

  private fetchApproximateCount(jql: string): Promise<number | undefined> {
    return new Promise(resolve => {
      this.api.approximateCount(jql, (err, data) => {
        resolve(!err && typeof data?.count === 'number' ? data.count : undefined);
      });
    });
  }
}
