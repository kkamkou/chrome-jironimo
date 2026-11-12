import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WorkspaceDraft } from '../../../../../src/app/lib/route/settings/helpers/workspace-draft.ts';
import { Settings } from '../../../../../src/app/lib/settings.ts';

test('WorkspaceDraft isolates account workspaces detects edits and commits without clobbering other accounts', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const settings = new Settings(
        {
          version: '600',
          workspaces: JSON.stringify([
            { account: 'ALL', icon: 'globe', title: 'Global', query: 'project = ALL' },
            { account: 'corp', icon: 'bug', title: 'Corp Bugs', query: 'project = CORP' }
          ])
        },
        key => key,
        () => undefined
      );
      const draft = new WorkspaceDraft(settings);
      const account = {
        id: 'corp',
        label: 'Corp',
        enabled: true,
        timeout: 5,
        type: 'basic',
        url: 'https://corp.jira'
      };
      const scoped = draft.forAccount(account);
      const cleanBefore = draft.dirty(account, scoped);
      const added = [...scoped, { ...draft.blank(account), title: 'Added', query: 'type = Bug' }];
      const dirtyAfter = draft.dirty(account, added);
      draft.commit(account, added);
      return {
        allId: draft.accountId('ALL'),
        cleanBefore,
        dirtyAfter,
        titles: settings.workspaces.map(ws => ws.title)
      };
    })(),
    {
      allId: 'ALL',
      cleanBefore: false,
      dirtyAfter: true,
      titles: ['Global', 'Corp Bugs', 'Added']
    },
    'WorkspaceDraft cannot isolate detect dirty state and commit account workspaces'
  );
});
