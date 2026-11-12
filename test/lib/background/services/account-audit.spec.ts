import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AccountAudit } from '../../../../src/app/lib/background/services/account-audit.ts';
import { FetchTransport } from '../../../../src/app/lib/http/fetch-transport.ts';
import { Notifications } from '../../../../src/app/lib/notifications.ts';
import { Settings } from '../../../../src/app/lib/settings.ts';

test('AccountAudit returns active accounts and notifies when an enabled account is unauthorized', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      const alerts: string[] = [];
      const settings = new Settings(
        {
          version: '600',
          accounts: JSON.stringify([
            { enabled: true, id: 'good', label: 'Good', timeout: 5, type: 'basic', url: 'https://good.jira' },
            { enabled: true, id: 'bad', label: 'Bad', timeout: 5, type: 'basic', url: 'https://bad.jira' },
            { enabled: false, id: 'off', label: 'Off', timeout: 5, type: 'basic', url: 'https://off.jira' }
          ])
        },
        key => key,
        () => undefined
      );
      const notifications = new Notifications(
        {
          create: (id, _opts, cb) => {
            alerts.push(id);
            cb(id);
          },
          update: (_id, _opts, cb) => cb(true),
          clear: (_id, cb) => cb(true)
        },
        'icons/app-128.png'
      );
      const transport = new FetchTransport(async url => {
        if (String(url).startsWith('https://good.jira')) {
          return new globalThis.Response(JSON.stringify({ active: true, accountId: 'u1' }), { status: 200 });
        }
        return new globalThis.Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
      });
      const valid = await new AccountAudit(settings, notifications, transport).verified();
      return { validIds: valid.map(item => item.account.id), alerts };
    })(),
    { validIds: ['good'], alerts: ['auth;bad'] },
    'AccountAudit cannot separate active accounts from unauthorized accounts and notify'
  );
});
