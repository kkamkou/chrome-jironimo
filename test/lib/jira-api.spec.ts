import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraErrorFormatter, JiraProbe, JiraRegistry } from '../../src/app/lib/jira-api.ts';

test('JiraErrorFormatter extracts x-authentication-denied-reason header when present', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new JiraErrorFormatter(key => key).messages({
      status: 403,
      headers: { 'x-authentication-denied-reason': 'CAPTCHA_CHALLENGE' },
      data: null
    }),
    ['CAPTCHA_CHALLENGE'],
    'JiraErrorFormatter cannot extract authentication denied header'
  );
});

test('JiraErrorFormatter maps seraph login reason on 401 responses', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new JiraErrorFormatter(key => `i18n:${key}`).messages({
      status: 401,
      headers: { 'x-seraph-loginreason': 'AUTHENTICATED_FAILED' },
      data: null
    }),
    ['i18n:jiraApiAuthenticationFailed'],
    'JiraErrorFormatter cannot translate seraph login reason'
  );
});

test('JiraErrorFormatter handles network rejections without headers or status', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new JiraErrorFormatter(key => `i18n:${key}`).messages(new TypeError('Failed to fetch') as never),
    ['i18n:jiraApiConnectionProblem'],
    'JiraErrorFormatter cannot handle network rejection without headers'
  );
});

test('JiraRegistry falls back to HTTP status label when statusCode translation is empty', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<[string, string[]]>(resolve => {
      const registry = new JiraRegistry(
        async () => {
          throw { status: 410, headers: {}, data: { errorMessages: ['Gone'] } };
        },
        key => (key.startsWith('statusCode') ? '' : key),
        (status, messages) => resolve([status, messages])
      );
      registry
        .instance({ id: 'default', label: 'Default', enabled: true, timeout: 5, type: 'basic', url: 'https://jira.example' })
        .myself(() => undefined);
    }),
    ['HTTP 410', ['Gone']],
    'JiraRegistry cannot fall back to HTTP status code label when translation is missing'
  );
});

test('JiraRegistry suppresses failure notification when v3 404 falls back to v2', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<[number, unknown]>(resolve => {
      let failures = 0;
      const registry = new JiraRegistry(
        async config => {
          if (String(config.url).includes('/rest/api/3/')) {
            throw { status: 404, headers: {}, data: null };
          }
          return { status: 200, headers: {}, data: { active: true, name: 'alice' } };
        },
        key => key,
        () => {
          failures += 1;
        }
      );
      registry
        .instance({ id: 'default', label: 'Default', enabled: true, timeout: 5, type: 'basic', url: 'https://issues.apache.org/jira' })
        .myself((_err, profile) => resolve([failures, profile]));
    }),
    [0, { active: true, name: 'alice' }],
    'JiraRegistry cannot suppress failure notification when v3 404 succeeds on v2'
  );
});

test('JiraProbe normalizes issue navigator and browse and rest URLs into base address', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    [
      new JiraProbe(async () => ({ status: 200, data: null })).normalize('https://issues.apache.org/jira/issues/?jql=project%3DSPARK'),
      new JiraProbe(async () => ({ status: 200, data: null })).normalize('https://issues.apache.org/jira/browse/PROJ-3319'),
      new JiraProbe(async () => ({ status: 200, data: null })).normalize('https://issues.apache.org/jira/rest/api/2/myself')
    ],
    [
      'https://issues.apache.org/jira',
      'https://issues.apache.org/jira',
      'https://issues.apache.org/jira'
    ],
    'JiraProbe cannot normalize JIRA page and REST URLs to base address'
  );
});

test('JiraProbe discovers authenticated v2 base address from issue navigator URL', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new JiraProbe(async config => {
      if (config.url === 'https://issues.apache.org/jira/rest/api/2/myself') {
        return { status: 200, data: { active: true, displayName: 'Alice' } };
      }
      throw { status: 404, data: null };
    }).run('https://issues.apache.org/jira/issues/', 5000),
    {
      matchedUrl: 'https://issues.apache.org/jira',
      version: 'v2',
      authenticated: true,
      user: 'Alice',
      attempts: [
        {
          baseUrl: 'https://issues.apache.org/jira',
          version: 'v3',
          endpoint: 'https://issues.apache.org/jira/rest/api/3/myself',
          status: 'failed',
          code: 404,
          detail: 'HTTP 404'
        },
        {
          baseUrl: 'https://issues.apache.org/jira',
          version: 'v2',
          endpoint: 'https://issues.apache.org/jira/rest/api/2/myself',
          status: 'ok',
          code: 200,
          detail: 'Alice'
        }
      ]
    },
    'JiraProbe cannot discover authenticated v2 base address from issue navigator URL'
  );
});

test('JiraProbe matches base address as unauthenticated when myself endpoint returns 401', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new JiraProbe(async config => {
      if (config.url === 'https://issues.apache.org/jira/rest/api/2/myself') {
        throw { status: 401, data: null };
      }
      throw { status: 404, data: null };
    }).run('https://issues.apache.org/jira/browse/SPARK-1', 5000),
    {
      matchedUrl: 'https://issues.apache.org/jira',
      version: 'v2',
      authenticated: false,
      attempts: [
        {
          baseUrl: 'https://issues.apache.org/jira',
          version: 'v3',
          endpoint: 'https://issues.apache.org/jira/rest/api/3/myself',
          status: 'failed',
          code: 404,
          detail: 'HTTP 404'
        },
        {
          baseUrl: 'https://issues.apache.org/jira',
          version: 'v2',
          endpoint: 'https://issues.apache.org/jira/rest/api/2/myself',
          status: 'unauthorized',
          code: 401,
          detail: 'HTTP 401'
        }
      ]
    },
    'JiraProbe cannot match base address as unauthenticated on 401 response'
  );
});
