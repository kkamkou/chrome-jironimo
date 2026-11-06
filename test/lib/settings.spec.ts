import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Settings } from '../../src/app/lib/settings.ts';

test('Settings initializes default version when storage is empty', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Settings({}, key => key).version,
    600,
    'Settings cannot initialize default version 600'
  );
});

test('Settings initializes default general configuration with only sync enabled', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new Settings({}, key => key).general,
    { sync: true },
    'Settings cannot initialize default general configuration without crash reporting'
  );
});

test('Settings migrates legacy pre-600 account data into accounts array', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Settings(
      {
        version: '500',
        account: JSON.stringify({ url: 'https://legacy.jira', timeout: 15, sync: true }),
        workspaces: JSON.stringify([{ title: 'Mine', query: 'assignee=currentUser()', icon: 'bug' }]),
        timers: JSON.stringify({})
      },
      key => key
    ).accounts[0].url,
    'https://legacy.jira',
    'Settings cannot migrate legacy account URL to version 600'
  );
});

test('Settings persists updated timer configuration to sync storage', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const synced: Record<string, string> = {};
      const settings = new Settings({}, key => key, items => Object.assign(synced, items));
      settings.timer = { enabled: false, workspace: 15, singleton: false };
      return JSON.parse(synced.timer);
    })(),
    { enabled: false, workspace: 15, singleton: false },
    'Settings cannot synchronize updated timer settings'
  );
});
