import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Request } from '../../../src/app/lib/http/request.ts';

test('Request resolves transport payload as Response instance', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    (await new Request(async () => ({ data: { total: 4 }, status: 200 })).fetch({ url: 'https://jira.example/rest' })).toJson(),
    { total: 4 },
    'Request cannot resolve transport response payload'
  );
});

test('Request rejects failed transport call with status code', { timeout: 1000 }, async () => {
  await assert.rejects(
    () => new Request(async () => {
      throw { data: 'Unauthorized', status: 401 };
    }).fetch({ url: 'https://jira.example/rest' }),
    (err: { code: () => number }) => err.code() === 401,
    'Request cannot reject with HTTP error status code'
  );
});
