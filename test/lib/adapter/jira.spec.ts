import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Jira } from '../../../src/app/lib/adapter/jira.ts';
import { Request } from '../../../src/app/lib/http/request.ts';

test('Jira delegates to JiraV3 when v3 endpoint responds', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<string>(resolve => {
      new Jira(
        new Request(async params => {
          resolve(`${params.method} ${params.url}`);
          return { data: [{ id: '10000', name: 'Blocker' }], status: 200 };
        }),
        'https://jira.example',
        4000
      ).priorities(() => undefined);
    }),
    'GET https://jira.example/rest/api/3/priority',
    'Jira cannot delegate to JiraV3 priority endpoint'
  );
});

test('Jira falls back from JiraV3 to JiraV2 when v3 myself endpoint returns 404', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<string[]>(resolve => {
      const urls: string[] = [];
      new Jira(
        new Request(async params => {
          urls.push(String(params.url));
          if (String(params.url).includes('/api/3/')) {
            throw { data: null, status: 404 };
          }
          return { data: { active: true, name: 'bob' }, status: 200 };
        }),
        'https://issues.apache.org/jira',
        4000
      ).authenticated((_err, flag) => resolve([...urls, String(flag)]));
    }),
    [
      'https://issues.apache.org/jira/rest/api/3/myself',
      'https://issues.apache.org/jira/rest/api/2/myself',
      'true'
    ],
    'Jira cannot fall back to JiraV2 myself endpoint when v3 returns 404'
  );
});

test('Jira retains JiraV2 delegate for subsequent requests after v3 404 fallback', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<string[]>(resolve => {
      const urls: string[] = [];
      const client = new Jira(
        new Request(async params => {
          urls.push(String(params.url));
          if (String(params.url).includes('/api/3/') || String(params.url).endsWith('/search/jql')) {
            throw { data: null, status: 404 };
          }
          return { data: { active: true, name: 'bob', issues: [], total: 10 }, status: 200 };
        }),
        'https://issues.apache.org/jira',
        4000
      );
      client.myself(() => {
        client.search({ jql: 'project = SPARK', startAt: 16 }, () => resolve(urls));
      });
    }),
    [
      'https://issues.apache.org/jira/rest/api/3/myself',
      'https://issues.apache.org/jira/rest/api/2/myself',
      'https://issues.apache.org/jira/rest/api/2/search/jql',
      'https://issues.apache.org/jira/rest/api/2/search'
    ],
    'Jira cannot retain JiraV2 delegate for subsequent requests after v3 fallback'
  );
});
