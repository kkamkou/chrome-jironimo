import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Notifications } from '../../src/app/lib/notifications.ts';

test('Notifications creates clickable notification with default icon when id is new', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<{ id: string; clickable: boolean }>(resolve => {
      new Notifications(
        {
          create: (id, options, cb) => {
            cb(id);
            resolve({ id, clickable: Boolean(options.isClickable) });
          },
          update: (_id, _options, cb) => cb(true),
          clear: (_id, cb) => cb(true)
        },
        'chrome-extension://id/icons/app-128.png'
      ).createOrUpdate('issue;default;JIR-1', {
        title: 'JIR-1',
        message: 'Updated'
      });
    }),
    { id: 'issue;default;JIR-1', clickable: true },
    'Notifications cannot create a clickable notification with default options'
  );
});

test('Notifications updates existing notification when id is already tracked', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<number>(resolve => {
      let updates = 0;
      const notifications = new Notifications(
        {
          create: (id, _options, cb) => cb(id),
          update: (_id, _options, cb) => {
            updates += 1;
            cb(true);
          },
          clear: (_id, cb) => cb(true)
        },
        'chrome-extension://id/icons/app-128.png'
      );
      notifications.createOrUpdate('auth;default', { title: 'Auth', message: 'First' }, () => {
        notifications.createOrUpdate('auth;default', { title: 'Auth', message: 'Second' }, () => resolve(updates));
      });
    }),
    1,
    'Notifications cannot update an already created notification'
  );
});
