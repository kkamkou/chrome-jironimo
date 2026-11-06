import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Response } from '../../../src/app/lib/http/response.ts';

test('Response returns numeric status code', { timeout: 1000 }, () => {
  assert.strictEqual(
    new Response({ ok: true }, 201).code(),
    201,
    'Response cannot return status code'
  );
});

test('Response returns payload from toJson', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new Response({ key: 'JIR-1' }, 200).toJson(),
    { key: 'JIR-1' },
    'Response cannot return JSON body'
  );
});
