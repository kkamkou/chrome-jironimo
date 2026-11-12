import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoardActivity } from '../../../../src/app/controllers/board/helpers/board-activity.ts';
import { Settings } from '../../../../src/app/lib/settings.ts';

test('BoardActivity selects remembered account index from activity state', { timeout: 1000 }, () => {
  assert.strictEqual(
    (() => {
      const settings = new Settings(
        {
          version: '600',
          activity: JSON.stringify({ lastAccount: 1, workspace: {} })
        },
        key => key,
        () => undefined
      );
      const accounts = [
        { id: 'one', label: 'One', enabled: true, timeout: 5, type: 'basic', url: 'https://one.jira' },
        { id: 'two', label: 'Two', enabled: true, timeout: 5, type: 'basic', url: 'https://two.jira' }
      ];
      return new BoardActivity(settings).initialAccount(accounts).id;
    })(),
    'two',
    'BoardActivity cannot select remembered account from activity state'
  );
});

test('BoardActivity falls back to first account when remembered index is out of range', { timeout: 1000 }, () => {
  assert.strictEqual(
    (() => {
      const settings = new Settings(
        {
          version: '600',
          activity: JSON.stringify({ lastAccount: 9, workspace: {} })
        },
        key => key,
        () => undefined
      );
      const accounts = [
        { id: 'one', label: 'One', enabled: true, timeout: 5, type: 'basic', url: 'https://one.jira' }
      ];
      return new BoardActivity(settings).initialAccount(accounts).id;
    })(),
    'one',
    'BoardActivity cannot fall back to first account when index exceeds list'
  );
});

test('BoardActivity activates account workspaces and persists lastAccount index', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings(
        {
          version: '600',
          workspaces: JSON.stringify([
            { account: 'ALL', icon: 'globe', title: 'Global', query: 'project = ALL' },
            { account: 'two', icon: 'bug', title: 'Two', query: 'project = TWO' },
            { account: 'other', icon: 'star', title: 'Other', query: 'project = OTH' }
          ]),
          activity: JSON.stringify({
            lastAccount: 0,
            workspace: { two: { index: 1, searchMaxResults: 50, timers: {} } }
          })
        },
        key => key,
        () => undefined
      );
      const accounts = [
        { id: 'one', label: 'One', enabled: true, timeout: 5, type: 'basic', url: 'https://one.jira' },
        { id: 'two', label: 'Two', enabled: true, timeout: 5, type: 'basic', url: 'https://two.jira' }
      ];
      const selection = new BoardActivity(settings).activate(accounts, accounts[1]);
      return {
        lastAccount: settings.activity.lastAccount,
        count: selection.workspaces.length,
        activeTitle: selection.activeWorkspace.title,
        maxResults: selection.maxResults
      };
    })(),
    { lastAccount: 1, count: 2, activeTitle: 'Two', maxResults: 50 },
    'BoardActivity cannot activate account workspaces and persist lastAccount index'
  );
});

test('BoardActivity records updated page limit and workspace index per account', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      const tracker = new BoardActivity(settings);
      tracker.recordLimit('acc', 75);
      tracker.recordWorkspace('acc', 2);
      return settings.activity.workspace.acc;
    })(),
    { index: 2, searchMaxResults: 75, timers: {} },
    'BoardActivity cannot persist search limit and workspace index per account'
  );
});
