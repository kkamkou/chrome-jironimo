import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JqlInspector } from '../../../../../src/app/lib/route/settings/services/jql-inspector.ts';

test('JqlInspector validates non-empty queries and detects watchable updated clauses', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      const inspector = new JqlInspector({
        instance: () =>
          ({
            validateJql: (jql: string, cb: (err: Error | null) => void) =>
              cb(jql.includes('BAD') ? new Error('Invalid') : null)
          }) as never
      });
      const account = {
        id: 'corp',
        label: 'Corp',
        enabled: true,
        timeout: 5,
        type: 'basic',
        url: 'https://corp.jira'
      };
      return {
        empty: await inspector.validate(account, ''),
        ok: await inspector.validate(account, 'project = DEMO'),
        bad: await inspector.validate(account, 'BAD QUERY'),
        watchUpdated: inspector.watchable('assignee = currentUser() ORDER BY updatedDate DESC'),
        watchCreated: inspector.watchable('reporter = currentUser() ORDER BY created DESC')
      };
    })(),
    { empty: false, ok: true, bad: false, watchUpdated: true, watchCreated: false },
    'JqlInspector cannot validate JQL queries and detect watchable updated clauses'
  );
});

test('JqlInspector imports deduplicated favourite filters excluding existing queries', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new JqlInspector({
      instance: () =>
        ({
          filterFavourite: (cb: (err: Error | null, data: Array<{ jql: string; name: string }>) => void) =>
            cb(null, [
              { name: 'Existing', jql: 'project = OLD' },
              { name: 'Fresh', jql: 'project = NEW' },
              { name: 'Duplicate Fresh', jql: 'project = NEW' }
            ])
        }) as never
    }).favorites(
      {
        id: 'corp',
        label: 'Corp',
        enabled: true,
        timeout: 5,
        type: 'basic',
        url: 'https://corp.jira'
      },
      [{ account: 'corp', icon: 'bug', title: 'Old', query: 'project = OLD' }]
    ),
    [{ account: 'corp', icon: 'heart-2', query: 'project = NEW', title: 'Fresh' }],
    'JqlInspector cannot deduplicate imported favourite filters against existing workspaces'
  );
});

test('JqlInspector rejects favourite import when JIRA client returns an error', { timeout: 1000 }, async () => {
  await assert.rejects(
    () =>
      new JqlInspector({
        instance: () =>
          ({
            filterFavourite: (cb: (err: Error | null) => void) => cb(new Error('Forbidden'))
          }) as never
      }).favorites(
        {
          id: 'corp',
          label: 'Corp',
          enabled: true,
          timeout: 5,
          type: 'basic',
          url: 'https://corp.jira'
        },
        []
      ),
    /Forbidden/,
    'JqlInspector cannot reject favourite import on API error'
  );
});
