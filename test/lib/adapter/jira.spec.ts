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
      url: 'https://jira.example/rest/api/latest/search',
      cache: false,
      params: { jql: 'project = DEMO' },
      responseType: 'json',
      timeout: 4000,
      headers: { ContentType: 'application/json; charset=UTF-8' }
    },
    'Jira cannot format GET search request options'
  );
});

test('Jira honours method override for worklog submission', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<string>(resolve => {
      new Jira(
        new Request(async params => {
          resolve(String(params.method));
          return { data: { id: '99' }, status: 201 };
        }),
        'https://jira.example',
        4000
      ).issueWorklog('1001', { _method: 'POST', comment: '10 minutes', timeSpent: '10m' }, () => undefined);
    }),
    'POST',
    'Jira cannot apply POST method override for worklogs'
  );
});
