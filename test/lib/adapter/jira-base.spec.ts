import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraBase, type JiraCallback } from '../../../src/app/lib/adapter/jira-base.ts';
import { Request } from '../../../src/app/lib/http/request.ts';

/**
 * Minimal concrete JiraBase implementation for verifying shared adapter behavior.
 */
class DummyJira extends JiraBase {
  protected prefix(): string {
    return '/api/2';
  }

  search(data: Record<string, unknown>, callback: JiraCallback): void {
    this.send('/api/2/search', data, callback);
  }

  approximateCount(_jql: string, callback: JiraCallback<{ count: number }>): void {
    callback(null, { count: 0 });
  }

  issueWorklog(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.send(`/api/2/issue/${issueId}/worklog`, data, callback);
  }
}

test('JiraBase verifies active user as authenticated', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<boolean>(resolve => {
      new DummyJira(
        new Request(async () => ({ data: { active: true, name: 'alice' }, status: 200 })),
        'https://jira.example',
        5000
      ).authenticated((_err, flag) => resolve(flag));
    }),
    true,
    'JiraBase cannot authenticate active user'
  );
});

test('JiraBase caches myself profile across repeated calls', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<number>(resolve => {
      let calls = 0;
      const client = new DummyJira(
        new Request(async () => {
          calls += 1;
          return { data: { active: true, name: 'alice' }, status: 200 };
        }),
        'https://jira.example',
        5000
      );
      client.myself(() => {
        client.myself(() => resolve(calls));
      });
    }),
    1,
    'JiraBase cannot cache myself profile across repeated calls'
  );
});
