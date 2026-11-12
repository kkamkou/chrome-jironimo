import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraProbe } from '../../../../../src/app/lib/jira-api.ts';
import { AccountRoster } from '../../../../../src/app/lib/route/settings/helpers/account-roster.ts';
import { Settings } from '../../../../../src/app/lib/settings.ts';

test('AccountRoster detects invalid accounts missing http scheme', { timeout: 1000 }, () => {
  assert.strictEqual(
    (() => {
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      const probe = new JiraProbe(async () => ({ status: 200, data: null }));
      const selected = {
        id: 'default',
        label: 'Default',
        enabled: true,
        timeout: 10,
        type: 'basic',
        url: 'ftp://invalid.jira'
      };
      return new AccountRoster(settings, probe).invalid([selected], selected);
    })(),
    true,
    'AccountRoster cannot detect invalid non-http account URL'
  );
});

test('AccountRoster normalizes account URLs and prunes orphan account keys on persist', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings(
        {
          version: '600',
          activity: JSON.stringify({
            lastAccount: 0,
            workspace: {
              corp: { index: 1, searchMaxResults: 25, timers: {} },
              stale: { index: 0, searchMaxResults: 16, timers: {} }
            }
          }),
          colors: JSON.stringify({
            theme: 'default',
            sizes: { task: 'default' },
            priority: {},
            accounts: {
              corp: { '1': { fg: 'white', bg: 'red', bd: 'white', ot: 'red' } },
              stale: { '1': { fg: 'white', bg: 'gray', bd: 'white', ot: 'gray' } }
            }
          })
        },
        key => key,
        () => undefined
      );
      const probe = new JiraProbe(async () => ({ status: 200, data: null }));
      const roster = new AccountRoster(settings, probe);
      const selected = {
        id: 'corp',
        label: 'Corp',
        enabled: true,
        timeout: 0,
        type: 'basic',
        url: 'https://corp.jira/browse/PROJ-1'
      };
      const normalized = roster.normalized([selected], selected);
      roster.persist(normalized, { sync: false });
      return {
        url: settings.accounts[0].url,
        timeout: settings.accounts[0].timeout,
        sync: settings.general.sync,
        activityKeys: Object.keys(settings.activity.workspace),
        colorKeys: Object.keys(settings.colors.accounts ?? {})
      };
    })(),
    {
      url: 'https://corp.jira',
      timeout: 10,
      sync: false,
      activityKeys: ['corp'],
      colorKeys: ['corp']
    },
    'AccountRoster cannot normalize account URLs and prune removed accounts from settings'
  );
});

test('AccountRoster builds slugified draft account and rejects duplicate ids', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      const probe = new JiraProbe(async () => ({ status: 200, data: null }));
      const roster = new AccountRoster(settings, probe);
      const created = roster.draft(settings.accounts, '  My Team #1  ');
      const duplicate = roster.draft([created!], 'my-team-1');
      const blank = roster.draft(settings.accounts, '');
      return { id: created?.id, enabled: created?.enabled, duplicate, blank };
    })(),
    { id: 'my_team_1', enabled: true, duplicate: null, blank: null },
    'AccountRoster cannot create unique slugified account draft'
  );
});
