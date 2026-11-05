import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraErrorFormatter, JiraRegistry } from '../../src/app/lib/jira-api.ts';

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
