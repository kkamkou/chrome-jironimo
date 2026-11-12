import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JiraErrorFormatter } from '../../../../src/app/lib/jira/helpers/error-diagnostics.ts';

test('JiraErrorFormatter maps HTTP 500 payload message and unknown response fallbacks', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const formatter = new JiraErrorFormatter(key => `t:${key}`);
      return {
        fiveHundred: formatter.messages({ status: 500 }),
        singleMessage: formatter.messages({ status: 400, data: { message: 'Bad field' } }),
        unknown: formatter.messages({ status: 418, data: {} })
      };
    })(),
    {
      fiveHundred: ['t:jiraApiCheckConfig'],
      singleMessage: ['Bad field'],
      unknown: ['t:jiraApiUknownResponse', 't:jiraApiCheckSettings']
    },
    'JiraErrorFormatter cannot format 500 message and unknown HTTP failure responses'
  );
});
