import _ from 'lodash';
import type { JiraClient } from '../../adapter/jira.ts';
import type { AccountConfig, SettingsStore } from '../../settings.ts';
import { Duration } from '../duration.ts';
import { BadgeState } from '../helpers/badge-state.ts';
import { type IssueSummary, WorklogPayload } from '../helpers/worklog-payload.ts';
import { TimerWorkLogEntry, type WorkLogEntry } from '../TimerWorkLogEntry.ts';

export type { IssueSummary } from '../helpers/worklog-payload.ts';

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
 * Worklog timer session scoped to a single JIRA account.
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
    this.hooks.badge(new BadgeState(this.settings).text());
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
    this.api.issueWorklog(issue.id, new WorklogPayload(span).body(), err => {
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
