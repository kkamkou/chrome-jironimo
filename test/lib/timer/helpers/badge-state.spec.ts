import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Settings } from '../../../../src/app/lib/settings.ts';
import { BadgeState } from '../../../../src/app/lib/timer/helpers/badge-state.ts';

test('BadgeState returns empty string single badge duration and active count across workspaces', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const empty = new Settings({ version: '600' }, key => key, () => undefined);
      const single = new Settings(
        {
          version: '600',
          activity: JSON.stringify({
            lastAccount: 0,
            workspace: {
              corp: {
                index: 0,
                searchMaxResults: 16,
                timers: { '1': { id: '1', state: 'STARTED', timestamp: Date.now() - 3600000 } }
              }
            }
          })
        },
        key => key,
        () => undefined
      );
      const multiple = new Settings(
        {
          version: '600',
          activity: JSON.stringify({
            lastAccount: 0,
            workspace: {
              corp: {
                index: 0,
                searchMaxResults: 16,
                timers: {
                  '1': { id: '1', state: 'STARTED', timestamp: Date.now() - 60000 },
                  '2': { id: '2', state: 'STARTED', timestamp: Date.now() - 120000 }
                }
              }
            }
          })
        },
        key => key,
        () => undefined
      );
      return {
        empty: new BadgeState(empty).text(),
        single: new BadgeState(single).text(),
        multiple: new BadgeState(multiple).text()
      };
    })(),
    { empty: '', single: '01:00', multiple: '2' },
    'BadgeState cannot compute empty single-timer and multi-timer badge labels'
  );
});
