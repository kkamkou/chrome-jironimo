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

test('TimerFactory submits worklog with ADF comment and clears entry when stopped after sixty seconds', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      let logged: Record<string, unknown> = {};
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
          issueWorklog: (_id: string, data: Record<string, unknown>, cb: (err: Error | null) => void) => {
            logged = data;
            cb(null);
          }
        } as never
      );
      timer.stop({ id: '55', fields: { status: { name: 'In Progress' }, issuetype: { name: 'Task' } } });
      return logged;
    })(),
    {
      _method: 'POST',
      timeSpent: '2m',
      comment: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '2 minutes' }]
          }
        ]
      }
    },
    'TimerFactory cannot submit two-minute ADF worklog when stopped'
  );
});
