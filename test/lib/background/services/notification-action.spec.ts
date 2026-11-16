import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NotificationAction } from '../../../../src/app/lib/background/services/notification-action.ts';
import { Notifications } from '../../../../src/app/lib/notifications.ts';
import { Settings } from '../../../../src/app/lib/settings.ts';

test('NotificationAction opens account and issue URLs when auth or issue notifications are clicked', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      const opened: string[] = [];
      (globalThis as any).chrome = {
        storage: {
          local: {
            get: (_keys: null, cb: (items: Record<string, string>) => void) =>
              cb({
                accounts: JSON.stringify([
                  { enabled: true, id: 'corp', label: 'Corp', timeout: 5, type: 'basic', url: 'https://corp.jira' }
                ])
              })
          }
        },
        tabs: {
          create: (opts: { url: string }) => opened.push(opts.url)
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
      const action = new NotificationAction(settings, notifications);
      action.clicked('auth;corp');
      action.clicked('issue;corp;DEMO-7');
      return opened;
    })(),
    ['https://corp.jira', 'https://corp.jira/browse/DEMO-7'],
    'NotificationAction cannot open account and issue URLs on notification clicks'
  );
});

test('NotificationAction disables unauthorized account on button click', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const cleared: string[] = [];
      const settings = new Settings(
        {
          version: '600',
          accounts: JSON.stringify([
            { enabled: true, id: 'corp', label: 'Corp', timeout: 5, type: 'basic', url: 'https://corp.jira' }
          ])
        },
        key => key,
        () => undefined
      );
      const notifications = new Notifications(
        {
          create: (id, _opts, cb) => cb(id),
          update: (_id, _opts, cb) => cb(true),
          clear: (id, cb) => {
            cleared.push(id);
            cb(true);
          }
        },
        'icons/app-128.png'
      );
      const action = new NotificationAction(settings, notifications);
      action.button('auth;corp');
      return { enabled: settings.accounts[0].enabled, cleared };
    })(),
    {
      enabled: false,
      cleared: ['auth;corp']
    },
    'NotificationAction cannot disable account on notification button clicks'
  );
});

test('NotificationAction records update hint on extension update without desktop notification', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const opened: string[] = [];
      let uninstallUrl = '';
      const created: string[] = [];
      (globalThis as any).chrome = {
        tabs: {
          create: (opts: { url: string }) => opened.push(opts.url)
        },
        runtime: {
          setUninstallURL: (url: string) => {
            uninstallUrl = url;
          }
        }
      };
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      const notifications = new Notifications(
        {
          create: (id, _opts, cb) => {
            created.push(id);
            cb(id);
          },
          update: (_id, _opts, cb) => cb(true),
          clear: (_id, cb) => cb(true)
        },
        'icons/app-128.png'
      );
      const action = new NotificationAction(settings, notifications);
      action.installed({ reason: 'install' } as chrome.runtime.InstalledDetails);
      action.installed({ reason: 'update' } as chrome.runtime.InstalledDetails);
      return {
        opened,
        hasUninstall: uninstallUrl.includes('docs.google.com'),
        created,
        updateHint: settings.activity.updateHint
      };
    })(),
    {
      opened: ['views/default.html#/settings/general'],
      hasUninstall: true,
      created: [],
      updateHint: true
    },
    'NotificationAction cannot record update hint on extension update without desktop notifications'
  );
});
