import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SettingsDefaults } from '../../../../src/app/lib/settings/helpers/settings-defaults.ts';

test('SettingsDefaults provides localized default structures for all configuration sections', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const defaults = new SettingsDefaults(key => `i18n:${key}`);
      return {
        general: defaults.general(),
        accountId: defaults.accounts()[0].id,
        epicSize: defaults.colors().sizes.epic,
        firstWorkspace: defaults.workspaces()[0].title,
        timer: defaults.timer(),
        lastAccount: defaults.activity().lastAccount
      };
    })(),
    {
      general: { sync: true },
      accountId: 'default',
      epicSize: 'triple',
      firstWorkspace: 'i18n:settingsWorkspaceCreatedByMe',
      timer: { enabled: true, workspace: 5, singleton: true },
      lastAccount: 0
    },
    'SettingsDefaults cannot build default configuration sections'
  );
});
