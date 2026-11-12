import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BackgroundDaemon } from '../src/app/bootstrap-bg.ts';
import { FetchTransport } from '../src/app/lib/http/fetch-transport.ts';
import { Notifications } from '../src/app/lib/notifications.ts';
import { Settings } from '../src/app/lib/settings.ts';

test('BackgroundDaemon notifies when workspace issue is updated by another user', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<string>(resolve => {
      const store: Record<string, string> = {
        version: '600',
        accounts: JSON.stringify([
          { enabled: true, id: 'default', label: 'Default', timeout: 5, type: 'basic', url: 'https://jira.example' }
        ]),
        workspaces: JSON.stringify([
          { account: 'ALL', icon: 'bug', title: 'Mine', query: 'project = DEMO', changesNotify: true }
        ])
      };
      const settings = new Settings(store, key => key, () => undefined);
      const notifications = new Notifications(
        {
          create: (id, _opts, cb) => {
            resolve(id);
            cb(id);
          },
          update: (_id, _opts, cb) => cb(true),
          clear: (_id, cb) => cb(true)
        },
        'icons/app-128.png'
      );
      const transport = new FetchTransport(async url => {
        if (String(url).includes('/myself')) {
          return new globalThis.Response(JSON.stringify({ active: true, accountId: 'acc-1' }), { status: 200 });
        }
        return new globalThis.Response(
          JSON.stringify({
            issues: [
              {
                id: '10',
                key: 'DEMO-10',
                fields: { updated: '2026-11-05T20:00:00.000Z', summary: 'Updated summary' },
                changelog: { histories: [{ author: { accountId: 'acc-2' } }] }
              }
            ]
          }),
          { status: 200 }
        );
      });
      new BackgroundDaemon(settings, notifications, transport).pollWorkspaces();
    }),
    'issue;default;DEMO-10',
    'BackgroundDaemon cannot create notification for issue updated by another user'
  );
});

test('BackgroundDaemon opens issue tab when clicked notification was already dismissed by OS', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<string>(resolve => {
      let clicked: ((id: string) => void) | undefined;
      (globalThis as any).chrome = {
        alarms: {
          onAlarm: { addListener: () => undefined },
          get: () => undefined,
          create: () => undefined
        },
        notifications: {
          onClicked: {
            addListener: (fn: (id: string) => void) => {
              clicked = fn;
            }
          },
          onButtonClicked: { addListener: () => undefined }
        },
        runtime: {
          onInstalled: { addListener: () => undefined }
        },
        tabs: {
          create: (opts: { url: string }) => resolve(opts.url)
        }
      };
      const store: Record<string, string> = {
        version: '600',
        accounts: JSON.stringify([
          { enabled: true, id: 'default', label: 'Default', timeout: 5, type: 'basic', url: 'https://jira.example' }
        ])
      };
      const settings = new Settings(store, key => key, () => undefined);
      const notifications = new Notifications(
        {
          create: (id, _opts, cb) => cb(id),
          update: (_id, _opts, cb) => cb(true),
          clear: (_id, cb) => cb(false)
        },
        'icons/app-128.png'
      );
      new BackgroundDaemon(settings, notifications).start();
      clicked?.('issue;default;DEMO-10');
    }),
    'https://jira.example/browse/DEMO-10',
    'BackgroundDaemon cannot open issue URL when clicked notification is dismissed'
  );
});

test('BackgroundDaemon schedules alarms syncs storage updates and refreshes badge on alarm', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const alarmsCreated: Array<{ name: string; period: number }> = [];
      const alarmListeners: Array<(alarm: { name: string }) => void> = [];
      let changedListener: ((changes: Record<string, { newValue?: string }>) => void) | undefined;
      let badgeText = 'unset';
      (globalThis as any).chrome = {
        action: {
          setBadgeText: (opts: { text: string }) => {
            badgeText = opts.text;
          }
        },
        alarms: {
          onAlarm: {
            addListener: (fn: (alarm: { name: string }) => void) => alarmListeners.push(fn)
          },
          get: (_name: string, cb: (alarm: undefined) => void) => cb(undefined),
          create: (name: string, opts: { periodInMinutes: number }) =>
            alarmsCreated.push({ name, period: opts.periodInMinutes })
        },
        notifications: {
          onClicked: { addListener: () => undefined },
          onButtonClicked: { addListener: () => undefined }
        },
        runtime: {
          onInstalled: { addListener: () => undefined }
        },
        storage: {
          local: {
            get: (_keys: null, cb: (items: Record<string, string>) => void) =>
              cb({ timer: JSON.stringify({ enabled: true, workspace: 10, singleton: true }) })
          },
          onChanged: {
            addListener: (fn: (changes: Record<string, { newValue?: string }>) => void) => {
              changedListener = fn;
            }
          }
        }
      };
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      const notifications = new Notifications(
        {
          create: (id, _opts, cb) => cb(id),
          update: (_id, _opts, cb) => cb(true),
          clear: (_id, cb) => cb(true)
        },
        'icons/app-128.png'
      );
      new BackgroundDaemon(settings, notifications).start();
      changedListener?.({
        timer: { newValue: JSON.stringify({ enabled: true, workspace: 15, singleton: true }) }
      });
      alarmListeners.forEach(fn => fn({ name: 'jironimoRefreshIcon' }));
      alarmListeners.forEach(fn => fn({ name: 'jironimoStatusCheck' }));
      return { alarmsCreated, badgeText };
    })(),
    {
      alarmsCreated: [
        { name: 'jironimoRefreshIcon', period: 1 },
        { name: 'jironimoStatusCheck', period: 10 },
        { name: 'jironimoRefreshIcon', period: 1 },
        { name: 'jironimoStatusCheck', period: 15 }
      ],
      badgeText: ''
    },
    'BackgroundDaemon cannot schedule alarms sync storage changes and refresh badge on alarm'
  );
});
