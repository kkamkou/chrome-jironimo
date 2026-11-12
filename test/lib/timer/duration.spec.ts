import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Duration } from '../../../src/app/lib/timer/duration.ts';

test('Duration formats ninety minutes into timezone-independent badge text', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Duration(5400000).badge(),
    '01:30',
    'Duration cannot format ninety minutes into 01:30 badge text'
  );
});

test('Duration humanizes sub-minute intervals as a few seconds', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Duration(25000).humanize(),
    'a few seconds',
    'Duration cannot humanize twenty-five seconds'
  );
});

test('Duration humanizes single-minute intervals', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Duration(60000).humanize(),
    'a minute',
    'Duration cannot humanize one minute'
  );
});

test('Duration humanizes multi-minute intervals', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Duration(900000).humanize(),
    '15 minutes',
    'Duration cannot humanize fifteen minutes'
  );
});

test('Duration humanizes multi-hour intervals', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Duration(10800000).humanize(),
    '3 hours',
    'Duration cannot humanize three hours'
  );
});

test('Duration converts milliseconds into rounded minutes', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Duration(150000).minutes(),
    3,
    'Duration cannot round two and a half minutes to three'
  );
});

test('Duration humanizes single-hour single-day and multi-day intervals', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    [
      new Duration(3600000).humanize(),
      new Duration(86400000).humanize(),
      new Duration(259200000).humanize()
    ],
    ['an hour', 'a day', '3 days'],
    'Duration cannot humanize hour day and multi-day intervals'
  );
});
