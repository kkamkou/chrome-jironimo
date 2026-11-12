import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PagedSearch } from '../../../../src/app/controllers/board/services/paged-search.ts';

test('PagedSearch walks cursor tokens to target page and resolves approximate count', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      const pager = new PagedSearch();
      const api = {
        myself: (cb: (err: Error | null, data: unknown) => void) => cb(null, { active: true }),
        approximateCount: (_jql: string, cb: (err: Error | null, data: { count: number }) => void) =>
          cb(null, { count: 40 }),
        search: (query: Record<string, unknown>, cb: (err: Error | null, data: unknown) => void) => {
          if (!query.nextPageToken) {
            cb(null, { issues: [{ id: '1' }], nextPageToken: 'tok-1' });
            return;
          }
          cb(null, { issues: [{ id: '2' }], nextPageToken: 'tok-2' });
        }
      } as never;
      await pager.page(api, 'project = DEMO', 1, 0, 0, false);
      const second = await pager.page(api, 'project = DEMO', 1, 2, 0, false);
      return { page: second.page, startAt: second.startAt, total: second.total, ids: second.data.issues };
    })(),
    { page: 2, startAt: 2, total: 4, ids: [{ id: '2' }] },
    'PagedSearch cannot advance cursor tokens to target page'
  );
});

test('PagedSearch jumps to last token page when jumpToEnd is requested', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      const pager = new PagedSearch();
      const api = {
        myself: (cb: (err: Error | null, data: unknown) => void) => cb(null, { active: true }),
        approximateCount: (_jql: string, cb: (err: Error | null, data: { count: number }) => void) =>
          cb(null, { count: 3 }),
        search: (query: Record<string, unknown>, cb: (err: Error | null, data: unknown) => void) => {
          if (!query.nextPageToken) {
            cb(null, { issues: [{ id: '1' }], nextPageToken: 'tok-last' });
            return;
          }
          cb(null, { issues: [{ id: '2' }] });
        }
      } as never;
      const last = await pager.page(api, 'project = DEMO', 1, 0, 0, true);
      return { page: last.page, total: last.total, id: last.data.issues[0].id };
    })(),
    { page: 1, total: 2, id: '2' },
    'PagedSearch cannot walk nextPageToken chain to final page'
  );
});

test('PagedSearch uses startAt offset when server returns numeric total without tokens', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await (async () => {
      let seenStartAt = -1;
      const pager = new PagedSearch();
      const api = {
        myself: (cb: (err: Error | null, data: unknown) => void) => cb(null, { active: true }),
        approximateCount: (_jql: string, cb: (err: Error | null, data: { count: number }) => void) =>
          cb(null, { count: 0 }),
        search: (query: Record<string, unknown>, cb: (err: Error | null, data: unknown) => void) => {
          seenStartAt = Number(query.startAt ?? 0);
          cb(null, { startAt: seenStartAt, total: 32, issues: [{ id: '17' }] });
        }
      } as never;
      const slice = await pager.page(api, 'project = LEGACY', 16, 1, 32, false);
      return { seenStartAt, startAt: slice.startAt, total: slice.total };
    })(),
    { seenStartAt: 16, startAt: 16, total: 32 },
    'PagedSearch cannot pass startAt offset for legacy server pagination'
  );
});

test('PagedSearch fetches single issue and rejects when myself lookup fails', { timeout: 1000 }, async () => {
  await assert.rejects(
    async () => {
      const pager = new PagedSearch();
      pager.reset();
      await pager.single(
        {
          myself: (cb: (err: Error | null, data: unknown) => void) => cb(new Error('Unauthorized'), null)
        } as never,
        'id = 1',
        1
      );
    },
    /Unauthorized/,
    'PagedSearch cannot reject single issue lookup when myself verification fails'
  );
});
