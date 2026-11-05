import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FetchTransport } from '../../../src/app/lib/http/fetch-transport.ts';

test('FetchTransport appends query parameters and credentials to GET requests', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<string>(resolve => {
      new FetchTransport(async (url, init) => {
        resolve(`${String(url)}|${init?.credentials}`);
        return new globalThis.Response(JSON.stringify({ ok: true }), { status: 200 });
      }).send({
        method: 'GET',
        url: 'https://jira.example/rest/api/latest/search',
        params: { jql: 'project = TEST', maxResults: 16 }
      });
    }),
    'https://jira.example/rest/api/latest/search?jql=project+%3D+TEST&maxResults=16|include',
    'FetchTransport cannot serialize GET query parameters with credentials'
  );
});

test('FetchTransport rejects non-2xx responses with status body and lowercase headers', { timeout: 1000 }, async () => {
  await assert.rejects(
    () =>
      new FetchTransport(async () =>
        new globalThis.Response(JSON.stringify({ errorMessages: ['Denied'] }), {
          status: 401,
          headers: { 'X-Seraph-LoginReason': 'AUTHENTICATED_FAILED' }
        })
      ).send({
        method: 'GET',
        url: 'https://jira.example/rest/api/latest/myself'
      }),
    (err: { status: number; headers: Record<string, string> }) =>
      err.status === 401 && err.headers['x-seraph-loginreason'] === 'AUTHENTICATED_FAILED',
    'FetchTransport cannot reject with HTTP status and lowercase headers'
  );
});
