import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OriginAccess } from '../../../../../src/app/lib/route/settings/services/origin-access.ts';

test('OriginAccess resolves when chrome permissions request grants host origins', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      let requested: string[] = [];
      (globalThis as any).chrome = {
        permissions: {
          request: (opts: { origins: string[] }, cb: (flag: boolean) => void) => {
            requested = opts.origins;
            cb(true);
          }
        }
      };
      await new OriginAccess().request(['https://corp.jira/']);
      return requested;
    })(),
    ['https://corp.jira/'],
    'OriginAccess cannot request host origin permissions via chrome permissions API'
  );
});

test('OriginAccess rejects when user declines host origin permission prompt', { timeout: 1000 }, async () => {
  await assert.rejects(
    () => {
      (globalThis as any).chrome = {
        permissions: {
          request: (_opts: { origins: string[] }, cb: (flag: boolean) => void) => cb(false)
        }
      };
      return new OriginAccess().request(['https://denied.jira/']);
    },
    'OriginAccess cannot reject when host origin permission is declined'
  );
});

test('OriginAccess resolves immediately when chrome permissions API is unavailable', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await (async () => {
      (globalThis as any).chrome = {};
      await new OriginAccess().request(['https://local.jira/']);
      return true;
    })(),
    true,
    'OriginAccess cannot resolve when chrome permissions API is absent'
  );
});
