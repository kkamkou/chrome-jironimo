import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraV2 } from '../../../src/app/lib/adapter/jira-v2.ts';
import { Request } from '../../../src/app/lib/http/request.ts';

test('JiraV2 queries v2 JQL search endpoint on Cloud when supported', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<Record<string, unknown>>(resolve => {
      new JiraV2(
        new Request(async params => {
          resolve({ url: params.url, params: params.params });
          return { data: { issues: [], nextPageToken: 'tok' }, status: 200 };
        }),
        'https://jira.example',
        4000
      ).search({ jql: 'project = DEMO', startAt: 16, nextPageToken: 'prev' }, () => undefined);
    }),
    {
      url: 'https://jira.example/rest/api/2/search/jql',
      params: { jql: 'project = DEMO', nextPageToken: 'prev' }
    },
    'JiraV2 cannot query v2 JQL search endpoint when supported'
  );
});

test('JiraV2 falls back from v2 search/jql to legacy v2 search with startAt when 404 is returned', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<Record<string, unknown>>(resolve => {
      const urls: string[] = [];
      new JiraV2(
        new Request(async params => {
          urls.push(String(params.url));
          if (String(params.url).endsWith('/search/jql')) {
            throw { data: null, status: 404 };
          }
          resolve({ urls, params: params.params });
          return { data: { issues: [], total: 10 }, status: 200 };
        }),
        'https://issues.apache.org/jira',
        4000
      ).search({ jql: 'project = SPARK', startAt: 16, nextPageToken: 'tok' }, () => undefined);
    }),
    {
      urls: [
        'https://issues.apache.org/jira/rest/api/2/search/jql',
        'https://issues.apache.org/jira/rest/api/2/search'
      ],
      params: { jql: 'project = SPARK', startAt: 16 }
    },
    'JiraV2 cannot fall back to legacy v2 search endpoint on 404'
  );
});

test('JiraV2 resolves approximate count as zero when v2 approximate-count endpoint returns 404', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<{ count: number } | undefined>(resolve => {
      new JiraV2(
        new Request(async () => {
          throw { data: null, status: 404 };
        }),
        'https://issues.apache.org/jira',
        4000
      ).approximateCount('project = SPARK', (_err, data) => resolve(data));
    }),
    { count: 0 },
    'JiraV2 cannot resolve approximate count as zero when endpoint returns 404'
  );
});

test('JiraV2 converts ADF worklog comment into plain text string', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<Record<string, unknown>>(resolve => {
      new JiraV2(
        new Request(async params => {
          resolve({ url: params.url, data: params.data });
          return { data: { id: '101' }, status: 201 };
        }),
        'https://issues.apache.org/jira',
        4000
      ).issueWorklog(
        '1001',
        {
          _method: 'POST',
          comment: {
            type: 'doc',
            version: 1,
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '15 minutes' }] }]
          },
          timeSpent: '15m'
        },
        () => undefined
      );
    }),
    {
      url: 'https://issues.apache.org/jira/rest/api/2/issue/1001/worklog?adjustEstimate=auto',
      data: { comment: '15 minutes', timeSpent: '15m' }
    },
    'JiraV2 cannot convert ADF worklog comment into plain text string'
  );
});

test('JiraV2 falls back to v2 search validation when jql parse endpoint returns 404', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<Record<string, unknown>>(resolve => {
      new JiraV2(
        new Request(async params => {
          if (String(params.url).includes('/jql/parse') || String(params.url).endsWith('/search/jql')) {
            throw { data: null, status: 404 };
          }
          resolve({ url: params.url, params: params.params });
          return { data: { issues: [] }, status: 200 };
        }),
        'https://issues.apache.org/jira',
        4000
      ).validateJql('reporter = currentUser()', () => undefined);
    }),
    {
      url: 'https://issues.apache.org/jira/rest/api/2/search',
      params: {
        jql: 'reporter = currentUser()',
        maxResults: 1,
        fields: 'id'
      }
    },
    'JiraV2 cannot fall back to v2 search validation on 404'
  );
});

test('JiraV2 reuses cached legacy search mode for subsequent search and approximateCount calls', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      const urls: string[] = [];
      const client = new JiraV2(
        new Request(async params => {
          urls.push(String(params.url));
          if (String(params.url).endsWith('/search/jql')) {
            throw { data: null, status: 404 };
          }
          return { data: { issues: [], count: 9 }, status: 200 };
        }),
        'https://issues.apache.org/jira',
        4000
      );
      await new Promise<void>(r => client.search({ jql: 'project = A' }, () => r()));
      await new Promise<void>(r => client.search({ jql: 'project = B' }, () => r()));
      const count = await new Promise<number>(r =>
        client.approximateCount('project = B', (_err, data) => r(data?.count ?? -1))
      );
      return { urls, count };
    })(),
    {
      urls: [
        'https://issues.apache.org/jira/rest/api/2/search/jql',
        'https://issues.apache.org/jira/rest/api/2/search',
        'https://issues.apache.org/jira/rest/api/2/search'
      ],
      count: 0
    },
    'JiraV2 cannot reuse cached legacySearch state across search and approximateCount calls'
  );
});
