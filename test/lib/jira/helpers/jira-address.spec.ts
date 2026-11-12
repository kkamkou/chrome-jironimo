import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraAddress } from '../../../../src/app/lib/jira/helpers/jira-address.ts';

test('JiraAddress generates ordered path prefix candidates from nested JIRA software URL', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new JiraAddress('https://host.example/ctx/sub/jira/software/c/projects/DEMO/boards/1').candidates(),
    ['https://host.example/ctx/sub', 'https://host.example/ctx', 'https://host.example'],
    'JiraAddress cannot generate ordered path candidates from nested JIRA URL'
  );
});

test('JiraAddress handles blank input and non-URL strings without throwing', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    {
      blankNorm: new JiraAddress('   ').normalized(),
      blankCandidates: new JiraAddress('').candidates(),
      rawCandidates: new JiraAddress('not a url///').candidates()
    },
    {
      blankNorm: '',
      blankCandidates: [],
      rawCandidates: ['not a url']
    },
    'JiraAddress cannot handle blank and non-URL address inputs'
  );
});
