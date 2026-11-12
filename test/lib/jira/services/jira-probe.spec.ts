import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraProbe } from '../../../../src/app/lib/jira/services/jira-probe.ts';

test('JiraProbe skips non-profile JSON responses and marks inactive profile as unauthorized', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new JiraProbe(async config => {
      if (String(config.url).includes('/api/3/')) {
        return { status: 200, data: { welcome: 'html gateway' } };
      }
      return { status: 200, data: { active: false, name: 'disabled-user' } };
    }).run('https://corp.jira', 5000),
    {
      matchedUrl: 'https://corp.jira',
      version: 'v2',
      authenticated: false,
      attempts: [
        {
          baseUrl: 'https://corp.jira',
          version: 'v3',
          endpoint: 'https://corp.jira/rest/api/3/myself',
          status: 'failed',
          code: 200,
          detail: 'HTTP 200'
        },
        {
          baseUrl: 'https://corp.jira',
          version: 'v2',
          endpoint: 'https://corp.jira/rest/api/2/myself',
          status: 'unauthorized',
          code: 200,
          detail: 'HTTP 200'
        }
      ]
    },
    'JiraProbe cannot skip non-profile payloads and flag inactive user as unauthorized'
  );
});

test('JiraProbe reports null match when all endpoints fail with network errors', { timeout: 1000 }, async () => {
  assert.strictEqual(
    (
      await new JiraProbe(async () => {
        throw new Error('ECONNREFUSED');
      }).run('https://offline.jira', 1000)
    ).matchedUrl,
    null,
    'JiraProbe cannot return null matchedUrl when all candidate endpoints fail to connect'
  );
});
