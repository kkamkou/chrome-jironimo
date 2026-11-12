import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Settings } from '../../../../src/app/lib/settings.ts';
import { SettingsMigration } from '../../../../src/app/lib/settings/helpers/settings-migration.ts';

test('SettingsMigration leaves version 600 storage untouched', { timeout: 1000 }, () => {
  assert.strictEqual(
    (() => {
      const store: Record<string, string> = { version: '600' };
      const settings = new Settings(store, key => key, () => undefined);
      new SettingsMigration(store).upgrade(settings);
      return settings.version;
    })(),
    600,
    'SettingsMigration cannot skip migration when schema is already version 600'
  );
});
