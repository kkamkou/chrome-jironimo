import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Settings } from '../../../../src/app/lib/settings/services/settings-store.ts';

test('Settings round-trips raw storage data and exposes settings and feedback URIs', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      settings.setStorageData({ customKey: '"stored"' });
      return {
        custom: settings.getStorageData().customKey,
        settingsUri: settings.getUriSettings(),
        feedbackHost: settings.getUriFeedback().startsWith('https://docs.google.com/')
      };
    })(),
    {
      custom: '"stored"',
      settingsUri: 'views/default.html#/settings/general',
      feedbackHost: true
    },
    'Settings cannot round-trip storage entries and return extension URIs'
  );
});
