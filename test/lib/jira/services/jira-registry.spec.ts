import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraRegistry } from '../../../../src/app/lib/jira/services/jira-registry.ts';

test('JiraRegistry reuses cached JiraClient instance for identical account id', { timeout: 1000 }, () => {
  assert.strictEqual(
    (() => {
      const registry = new JiraRegistry(
        async () => ({ status: 200, data: { active: true } }),
        key => key
      );
      const account = {
        id: 'corp',
        label: 'Corp',
        enabled: true,
        timeout: 5,
        type: 'basic',
        url: 'https://corp.jira'
      };
      return registry.instance(account) === registry.instance(account);
    })(),
    true,
    'JiraRegistry cannot cache and reuse JiraClient instance per account id'
  );
});
