import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Settings } from '../../src/app/lib/settings.ts';
import { TimerFactory } from '../../src/app/lib/timer.ts';

test('TimerFactory prevents starting a second issue when singleton mode is enabled', { timeout: 1000 }, () => {
  assert.strictEqual(
    (() => {
      const settings = new Settings({}, key => key);
      const timer = new TimerFactory(settings, () => undefined, () => undefined).instance(
        { id: 'default', label: 'Default', enabled: true, timeout: 10, type: 'basic', url: 'https://jira.example' },
        { issueWorklog: () => undefined } as never
      );
      timer.start({ id: '1', fields: { status: { name: 'Open' } } });
      return timer.canBeStarted({ id: '2', fields: { status: { name: 'Open' } } });
    })(),
    false,
    'TimerFactory cannot block a second active timer in singleton mode'
  );
});

test('TimerFactory submits worklog and clears entry when stopped after sixty seconds', { timeout: 1000 }, () => {
  assert.strictEqual(
    (() => {
      let logged = '';
      const store: Record<string, string> = {
        version: '600',
        activity: JSON.stringify({
          lastAccount: 0,
          workspace: {
            default: {
              index: 0,
              searchMaxResults: 16,
              timers: {
                '55': { id: '55', state: 'STARTED', timestamp: Date.now() - 120000 }
              }
            }
          }
        })
      };
      const settings = new Settings(store, key => key);
      const timer = new TimerFactory(settings, () => undefined, () => undefined).instance(
        { id: 'default', label: 'Default', enabled: true, timeout: 10, type: 'basic', url: 'https://jira.example' },
        {
          issueWorklog: (_id: string, data: { timeSpent: string }, cb: (err: Error | null) => void) => {
            logged = data.timeSpent;
            cb(null);
          }
        } as never
      );
      timer.stop({ id: '55', fields: { status: { name: 'In Progress' } } });
      return logged;
    })(),
    '2m',
    'TimerFactory cannot submit two-minute worklog when stopped'
  );
});
