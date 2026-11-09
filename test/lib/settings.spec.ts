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

test('Settings maps JIRA priority statusColor hex values to nearest Metro palette colors', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new Settings({}, key => key).samplePriorities([
      { id: '100', name: 'P1', statusColor: '#e51400' },
      { id: '200', name: 'P2', statusColor: '#fa6800' },
      { id: '300', name: 'P3', statusColor: '#4390df' }
    ]),
    {
      100: { fg: 'white', bg: 'red', bd: 'white', ot: 'red', label: 'P1', rank: 1 },
      200: { fg: 'white', bg: 'orange', bd: 'white', ot: 'orange', label: 'P2', rank: 2 },
      300: { fg: 'white', bg: 'lightBlue', bd: 'white', ot: 'lightBlue', label: 'P3', rank: 3 }
    },
    'Settings cannot map JIRA statusColor hex values to Metro palette colors'
  );
});

test('Settings falls back to semantic priority names when statusColor is shared across priorities', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new Settings({}, key => key).samplePriorities([
      { id: '1', name: 'Low', statusColor: '#cccccc' },
      { id: '2', name: 'Medium', statusColor: '#cccccc' },
      { id: '3', name: 'High', statusColor: '#cccccc' },
      { id: '4', name: 'Blocker', statusColor: '#cccccc' }
    ]),
    {
      1: { fg: 'white', bg: 'gray', bd: 'white', ot: 'gray', label: 'Low', rank: 1 },
      2: { fg: 'white', bg: 'lightOlive', bd: 'white', ot: 'lightOlive', label: 'Medium', rank: 2 },
      3: { fg: 'white', bg: 'orange', bd: 'white', ot: 'orange', label: 'High', rank: 3 },
      4: { fg: 'white', bg: 'red', bd: 'white', ot: 'red', label: 'Blocker', rank: 4 }
    },
    'Settings cannot map semantic priority names when statusColor is shared'
  );
});
