import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraV3 } from '../../../src/app/lib/adapter/jira-v3.ts';
import { Request } from '../../../src/app/lib/http/request.ts';

test('JiraV3 queries v3 JQL search endpoint and strips startAt offset', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<Record<string, unknown>>(resolve => {
      new JiraV3(
        new Request(async params => {
          resolve(params);
          return { data: { issues: [] }, status: 200 };
        }),
        'https://jira.example',
        4000
      ).search({ jql: 'project = DEMO', startAt: 16 }, () => undefined);
    }),
    {
      method: 'GET',
      url: 'https://jira.example/rest/api/3/search/jql',
      cache: false,
      params: { jql: 'project = DEMO' },
      responseType: 'json',
      timeout: 4000
    },
    'JiraV3 cannot format GET search request options without startAt'
  );
});

test('JiraV3 requests approximate issue count via POST to v3 endpoint', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<Record<string, unknown>>(resolve => {
      new JiraV3(
        new Request(async params => {
          resolve({ method: params.method, url: params.url, data: params.data });
          return { data: { count: 42 }, status: 200 };
        }),
        'https://jira.example',
        4000
      ).approximateCount('project = DEMO', () => undefined);
    }),
    {
      method: 'POST',
      url: 'https://jira.example/rest/api/3/search/approximate-count',
      data: { jql: 'project = DEMO' }
    },
    'JiraV3 cannot request approximate count via POST'
  );
});

test('JiraV3 honours method override for v3 worklog submission', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<string>(resolve => {
      new JiraV3(
        new Request(async params => {
          resolve(`${params.method} ${params.url}`);
          return { data: { id: '99' }, status: 201 };
        }),
        'https://jira.example',
        4000
      ).issueWorklog('1001', { _method: 'POST', comment: '10 minutes', timeSpent: '10m' }, () => undefined);
    }),
    'POST https://jira.example/rest/api/3/issue/1001/worklog?adjustEstimate=auto',
    'JiraV3 cannot apply POST method override for v3 worklogs'
  );
});

test('JiraV3 requests configured priorities from v3 priority endpoint', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<string>(resolve => {
      new JiraV3(
        new Request(async params => {
          resolve(`${params.method} ${params.url}`);
          return { data: [{ id: '10000', name: 'Blocker' }], status: 200 };
        }),
        'https://jira.example',
        4000
      ).priorities(() => undefined);
    }),
    'GET https://jira.example/rest/api/3/priority',
    'JiraV3 cannot fetch priority definitions from v3 endpoint'
  );
});
