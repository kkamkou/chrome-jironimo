import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Jira } from '../../../src/app/lib/adapter/jira.ts';
import { Request } from '../../../src/app/lib/http/request.ts';

test('Jira verifies active user as authenticated', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<boolean>(resolve => {
      new Jira(
        new Request(async () => ({ data: { active: true, name: 'alice' }, status: 200 })),
        'https://jira.example',
        5000
      ).authenticated((_err, flag) => resolve(flag));
    }),
    true,
    'Jira cannot authenticate active user'
  );
});

test('Jira converts GET payload into query params and strips method override', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<Record<string, unknown>>(resolve => {
      new Jira(
        new Request(async params => {
          resolve(params);
          return { data: { issues: [] }, status: 200 };
        }),
        'https://jira.example',
        4000
      ).search({ jql: 'project = DEMO' }, () => undefined);
    }),
    {
      method: 'GET',
      url: 'https://jira.example/rest/api/3/search/jql',
      cache: false,
      params: { jql: 'project = DEMO' },
      responseType: 'json',
      timeout: 4000
    },
    'Jira cannot format GET search request options'
  );
});

test('Jira requests approximate issue count via POST to v3 endpoint', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<Record<string, unknown>>(resolve => {
      new Jira(
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
    'Jira cannot request approximate count via POST'
  );
});

test('Jira honours method override for v3 worklog submission', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<string>(resolve => {
      new Jira(
        new Request(async params => {
          resolve(`${params.method} ${params.url}`);
          return { data: { id: '99' }, status: 201 };
        }),
        'https://jira.example',
        4000
      ).issueWorklog('1001', { _method: 'POST', comment: '10 minutes', timeSpent: '10m' }, () => undefined);
    }),
    'POST https://jira.example/rest/api/3/issue/1001/worklog?adjustEstimate=auto',
    'Jira cannot apply POST method override for v3 worklogs'
  );
});
