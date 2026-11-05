import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TimerWorkLogEntry } from '../../../src/app/lib/timer/TimerWorkLogEntry.ts';

test('TimerWorkLogEntry reports started state when initialized as started', { timeout: 1000 }, () => {
  assert.strictEqual(
    new TimerWorkLogEntry('101', 'STARTED', 1700000000000).started,
    true,
    'TimerWorkLogEntry cannot report started state'
  );
});

test('TimerWorkLogEntry reports stopped state after stopping', { timeout: 1000 }, () => {
  assert.strictEqual(
    new TimerWorkLogEntry('102', 'STARTED', 1700000000000).stop().stopped,
    true,
    'TimerWorkLogEntry cannot transition to stopped state'
  );
});

test('TimerWorkLogEntry serializes identifier state and timestamp to JSON', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new TimerWorkLogEntry('103', 'STARTED', 1700000005000).toJSON(),
    { id: '103', state: 'STARTED', timestamp: 1700000005000 },
    'TimerWorkLogEntry cannot serialize fields to JSON'
  );
});

test('TimerWorkLogEntry rejects unknown state values', { timeout: 1000 }, () => {
  assert.throws(
    () => new TimerWorkLogEntry('104', 'INVALID', 1700000000000),
    TypeError,
    'TimerWorkLogEntry doesnt reject unknown state values'
  );
});
