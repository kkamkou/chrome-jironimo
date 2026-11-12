import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Duration } from '../../../../src/app/lib/timer/duration.ts';
import { WorklogPayload } from '../../../../src/app/lib/timer/helpers/worklog-payload.ts';

test('WorklogPayload builds ADF document body with humanized comment and minute duration', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new WorklogPayload(new Duration(300000)).body(),
    {
      _method: 'POST',
      comment: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '5 minutes' }]
          }
        ]
      },
      timeSpent: '5m'
    },
    'WorklogPayload cannot build ADF worklog request body'
  );
});
