import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IssueAppearance } from '../../../../src/app/controllers/board/helpers/issue-appearance.ts';
import { Settings } from '../../../../src/app/lib/settings.ts';

test('IssueAppearance applies account-specific priority colors humanized estimate and closed flag', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings(
        {
          version: '600',
          colors: JSON.stringify({
            theme: 'default',
            sizes: { story: 'double', task: 'default' },
            priority: { 1: { fg: 'white', bg: 'red', bd: 'white', ot: 'red' } },
            accounts: {
              corp: { '10': { fg: 'white', bg: 'cobalt', bd: 'white', ot: 'cobalt' } }
            }
          })
        },
        key => key,
        () => undefined
      );
      const decorated = new IssueAppearance(settings).apply(
        {
          id: '1',
          fields: {
            status: { name: 'Closed' },
            timeestimate: 300,
            issuetype: { name: 'Story' },
            priority: { id: 10 }
          }
        },
        'corp'
      );
      return {
        closed: decorated._isClosed,
        bg: decorated._colors.bg,
        size: decorated._size,
        estimate: decorated.fields.timeestimate
      };
    })(),
    { closed: true, bg: 'cobalt', size: 'double', estimate: '5 minutes' },
    'IssueAppearance cannot apply account priority colors humanized estimate and closed state'
  );
});

test('IssueAppearance falls back to global priority colors and default task size', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      const decorated = new IssueAppearance(settings).apply({
        id: '2',
        fields: {
          status: { name: 'Open' },
          issuetype: { name: 'CustomType' },
          priority: { id: 2 }
        }
      });
      return {
        closed: decorated._isClosed,
        bg: decorated._colors.bg,
        size: decorated._size
      };
    })(),
    { closed: false, bg: 'orange', size: 'default' },
    'IssueAppearance cannot fall back to global priority colors and default task size'
  );
});
