import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Settings } from '../../../../src/app/lib/settings.ts';
import { TimerFactory } from '../../../../src/app/lib/timer/services/timer-factory.ts';

test('TimerFactory refreshes badge callback from active workspace timers', { timeout: 1000 }, () => {
  assert.strictEqual(
    (() => {
      let badge = '';
      const settings = new Settings(
        {
          version: '600',
          activity: JSON.stringify({
            lastAccount: 0,
            workspace: {
              corp: {
                index: 0,
                searchMaxResults: 16,
                timers: { '1': { id: '1', state: 'STARTED', timestamp: Date.now() - 1800000 } }
              }
            }
          })
        },
        key => key,
        () => undefined
      );
      new TimerFactory(
        settings,
        text => {
          badge = text;
        },
        () => undefined
      ).refreshBadge();
      return badge;
    })(),
    '00:30',
    'TimerFactory cannot refresh badge callback with formatted active timer duration'
  );
});
