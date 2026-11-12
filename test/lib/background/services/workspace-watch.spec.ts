import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WorkspaceWatch } from '../../../../src/app/lib/background/services/workspace-watch.ts';
import { Notifications } from '../../../../src/app/lib/notifications.ts';
import { Settings } from '../../../../src/app/lib/settings.ts';

test('WorkspaceWatch deduplicates issues across workspaces and ignores changes made by myself', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      const notified: string[] = [];
      const settings = new Settings(
        {
          version: '600',
          workspaces: JSON.stringify([
            { account: 'ALL', icon: 'bug', title: 'First', query: 'project = DEMO', changesNotify: true },
            { account: 'ALL', icon: 'eye-2', title: 'Second', query: 'project = DEMO', changesNotify: true }
          ])
        },
        key => key,
        () => undefined
      );
      const notifications = new Notifications(
        {
          create: (id, _opts, cb) => {
            notified.push(id);
            cb(id);
          },
          update: (_id, _opts, cb) => cb(true),
          clear: (_id, cb) => cb(true)
        },
        'icons/app-128.png'
      );
      const audit = {
        verified: async () => [
          {
            problem: false,
            account: {
              enabled: true,
              id: 'corp',
              label: 'Corp',
              timeout: 5,
              type: 'basic',
              url: 'https://corp.jira'
            },
            myself: { active: true, accountId: 'me-1' },
            api: {
              search: (_query: unknown, cb: (err: Error | null, res: unknown) => void) =>
                cb(null, {
                  issues: [
                    {
                      id: '10',
                      key: 'DEMO-10',
                      fields: { updated: '2026-11-05T20:00:00.000Z', summary: 'Peer change' },
                      changelog: { histories: [{ author: { accountId: 'peer-2' } }] }
                    },
                    {
                      id: '11',
                      key: 'DEMO-11',
                      fields: { updated: '2026-11-05T20:01:00.000Z', summary: 'Self change' },
                      changelog: { histories: [{ author: { accountId: 'me-1' } }] }
                    }
                  ]
                })
            } as never
          }
        ]
      };
      await new WorkspaceWatch(settings, notifications, audit).poll();
      return notified;
    })(),
    ['issue;corp;DEMO-10'],
    'WorkspaceWatch cannot deduplicate workspace issues and ignore self-authored updates'
  );
});
