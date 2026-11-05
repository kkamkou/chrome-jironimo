import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PaginationSlice } from '../../../src/app/shared/directive/pagination-slice.ts';

test('PaginationSlice computes current page and bounds from position limit and total', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new PaginationSlice(16, 16, 40).summary(),
    { page: 1, pages: 3, hasPrev: true, hasNext: true },
    'PaginationSlice cannot compute middle page state'
  );
});

test('PaginationSlice computes last page offset from total items and page limit', { timeout: 1000 }, () => {
  assert.strictEqual(
    new PaginationSlice(0, 16, 40).lastOffset(),
    32,
    'PaginationSlice cannot compute offset for last page'
  );
});
