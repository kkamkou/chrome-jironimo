import _ from 'lodash';
import type { JiraClient } from './adapter/jira.ts';
import type { AccountConfig, SettingsStore } from './settings.ts';
import { Duration } from './timer/duration.ts';
import { TimerWorkLogEntry, type WorkLogEntry } from './timer/TimerWorkLogEntry.ts';

export interface IssueSummary {
  id: string;
  key?: string;
  fields: {
    status: {
      name?: string;
      iconUrl?: string;
    };
    reporter?: {
      displayName?: string;
    };
    summary?: string;
    timeestimate?: string | number;
    issuetype: {
      name?: string;
    };
    priority?: {
      id?: number | string;
    };
    progress?: {
      percent: number;
    };
    assignee?: unknown;
    [key: string]: any;
  };
  transitions?: Array<{ id: string; name: string }>;
  [key: string]: any;
}

export interface WorklogTimer {
  persist(): WorklogTimer;
  resetBadge(): WorklogTimer;
  isStarted(issue: IssueSummary): boolean;
  canBeStarted(issue: IssueSummary): boolean;
  canBeStopped(issue: IssueSummary): boolean;
  elapsedTime(issue: IssueSummary): string;
  start(issue: IssueSummary): void;
  stop(issue: IssueSummary): void;
  discard(issue: IssueSummary): void;
}

/**
 * Worklog timer session controller scoped to a single JIRA account.
 */
export class AccountTimer implements WorklogTimer {
  private readonly settings: SettingsStore;
  private readonly account: AccountConfig;
  private readonly api: JiraClient;
  private readonly hooks: {
    badge: (text: string) => void;
    modified: (issue: IssueSummary) => void;
    storage: Record<string, WorkLogEntry>;
  };

  constructor(
    settings: SettingsStore,
    account: AccountConfig,
    api: JiraClient,
    hooks: { badge: (text: string) => void; modified: (issue: IssueSummary) => void }
  ) {
    this.settings = settings;
    this.account = account;
    this.api = api;
    const storage = _.mapValues(
      settings.activity.workspace[account.id]?.timers ?? {},
      item => new TimerWorkLogEntry(item.id, item.state, item.timestamp)
    );
    this.hooks = { ...hooks, storage };
    Object.freeze(this);
  }

  persist(): WorklogTimer {
    const timers = _.mapValues(
      _.pickBy(this.hooks.storage, entry => entry.started),
      entry => entry.toJSON()
    );
    const activity = this.settings.activity;
    const current = activity.workspace[this.account.id] ?? {
      index: 0,
      searchMaxResults: 16,
      timers: {}
    };
    activity.workspace[this.account.id] = { ...current, timers };
    this.settings.activity = activity;
    return this;
  }

  resetBadge(): WorklogTimer {
    new TimerFactory(this.settings, this.hooks.badge, this.hooks.modified).refreshBadge();
    return this;
  }

  isStarted(issue: IssueSummary): boolean {
    return this.hooks.storage[issue.id] ? this.hooks.storage[issue.id].started : false;
  }

  canBeStarted(issue: IssueSummary): boolean {
    let allowed =
      this.settings.timer.enabled &&
      !this.isStarted(issue) &&
      issue.fields?.status?.name !== 'Closed';
    if (this.settings.timer.singleton) {
      allowed = allowed && !Object.values(this.hooks.storage).some(entry => entry.started);
    }
    return allowed;
  }

  canBeStopped(issue: IssueSummary): boolean {
    return this.isStarted(issue);
  }

  elapsedTime(issue: IssueSummary): string {
    return this.isStarted(issue)
      ? new Duration(this.hooks.storage[issue.id].duration).humanize()
      : '?';
  }

  start(issue: IssueSummary): void {
    if (!this.hooks.storage[issue.id]) {
      this.hooks.storage[issue.id] = new TimerWorkLogEntry(issue.id);
    }
    this.hooks.storage[issue.id].start();
    this.persist().resetBadge();
  }

  stop(issue: IssueSummary): void {
    if (!this.canBeStopped(issue)) {
      return;
    }
    const span = new Duration(this.hooks.storage[issue.id].duration);
    if (span.seconds() < 60) {
      return;
    }
    this.persist().resetBadge();
    this.hooks.storage[issue.id].stop();
    const payload = {
      _method: 'POST',
      comment: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: span.humanize() }]
          }
        ]
      },
      timeSpent: `${span.minutes()}m`
    };
    this.api.issueWorklog(issue.id, payload, err => {
      if (err) {
        this.hooks.storage[issue.id].resume();
        return;
      }
      delete this.hooks.storage[issue.id];
      this.persist().resetBadge();
      this.hooks.modified(issue);
    });
  }

  discard(issue: IssueSummary): void {
    if (!this.canBeStopped(issue)) {
      return;
    }
    delete this.hooks.storage[issue.id];
    this.persist().resetBadge();
  }
}

/**
 * Factory creating account-scoped WorklogTimer instances.
 */
export class TimerFactory {
  private readonly settings: SettingsStore;
  private readonly badge: (text: string) => void;
  private readonly modified: (issue: IssueSummary) => void;

  constructor(
    settings: SettingsStore,
    badge: (text: string) => void = text => {
      const target = typeof chrome !== 'undefined' ? (chrome.action ?? chrome.browserAction) : undefined;
      if (target) {
        target.setBadgeText({ text });
      }
    },
    modified: (issue: IssueSummary) => void = () => undefined
  ) {
    this.settings = settings;
    this.badge = badge;
    this.modified = modified;
    Object.freeze(this);
  }

  instance(account: AccountConfig, api: JiraClient): WorklogTimer {
    return new AccountTimer(this.settings, account, api, {
      badge: this.badge,
      modified: this.modified
    });
  }

  refreshBadge(): void {
    const entries = Object.values(this.settings.activity.workspace).flatMap(ws =>
      Object.values(ws?.timers ?? {})
    );
    if (entries.length < 1) {
      this.badge('');
      return;
    }
    if (entries.length > 1) {
      this.badge(String(entries.length));
      return;
    }
    this.badge(new Duration(Date.now() - entries[0].timestamp).badge());
  }
}
