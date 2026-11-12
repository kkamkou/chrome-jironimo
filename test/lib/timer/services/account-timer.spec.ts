import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Settings } from '../../../../src/app/lib/settings.ts';
import { AccountTimer } from '../../../../src/app/lib/timer/services/account-timer.ts';

test('AccountTimer reports elapsed time ignores sub-minute stop resumes on API failure and discards session', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings(
        {
          version: '600',
          timer: JSON.stringify({ enabled: true, workspace: 5, singleton: false }),
          activity: JSON.stringify({
            lastAccount: 0,
            workspace: {
              corp: {
                index: 0,
                searchMaxResults: 16,
                timers: {
                  '10': { id: '10', state: 'STARTED', timestamp: Date.now() - 180000 },
                  '20': { id: '20', state: 'STARTED', timestamp: Date.now() - 10000 }
                }
              }
            }
          })
        },
        key => key,
        () => undefined
      );
      const timer = new AccountTimer(
        settings,
        { id: 'corp', label: 'Corp', enabled: true, timeout: 5, type: 'basic', url: 'https://corp.jira' },
        {
          issueWorklog: (_id: string, _data: unknown, cb: (err: Error | null) => void) =>
            cb(new Error('Network failure'))
        } as never,
        { badge: () => undefined, modified: () => undefined }
      );
      const ten = { id: '10', fields: { status: { name: 'Open' }, issuetype: { name: 'Task' } } };
      const twenty = { id: '20', fields: { status: { name: 'Open' }, issuetype: { name: 'Task' } } };
      const unstarted = { id: '99', fields: { status: { name: 'Open' }, issuetype: { name: 'Task' } } };
      const elapsedBefore = timer.elapsedTime(ten);
      const unknownElapsed = timer.elapsedTime(unstarted);
      timer.stop(twenty);
      timer.stop(ten);
      const resumedAfterError = timer.isStarted(ten);
      timer.discard(twenty);
      return {
        elapsedBefore,
        unknownElapsed,
        resumedAfterError,
        discardedStopped: !timer.isStarted(twenty)
      };
    })(),
    {
      elapsedBefore: '3 minutes',
      unknownElapsed: '?',
      resumedAfterError: true,
      discardedStopped: true
    },
    'AccountTimer cannot format elapsed time resume after worklog error and discard active timer'
  );
});
