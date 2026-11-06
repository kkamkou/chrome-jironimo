export interface PageSummary {
  readonly page: number;
  readonly pages: number;
  readonly hasPrev: boolean;
  readonly hasNext: boolean;
}

export interface PageWindow {
  summary(): PageSummary;
  firstOffset(): number;
  prevOffset(): number;
  nextOffset(): number;
  lastOffset(): number;
}

/**
 * Immutable pagination window calculation from item position, page limit, and total count.
 */
export class PaginationSlice implements PageWindow {
  private readonly position: number;
  private readonly limit: number;
  private readonly total: number;

  constructor(position: number, limit: number, total: number) {
    this.position = Number(position) || 0;
    this.limit = Number(limit) || 16;
    this.total = Number(total) || 0;
    Object.freeze(this);
  }

  summary(): PageSummary {
    const page = this.position ? Math.trunc(this.position / this.limit) : 0;
    const pages = Math.ceil(this.total / this.limit);
    return {
      page,
      pages,
      hasPrev: page > 0,
      hasNext: page < pages - 1
    };
  }

  firstOffset(): number {
    return 0;
  }

  prevOffset(): number {
    const info = this.summary();
    return this.offsetAt(info.page - 1, info.pages);
  }

  nextOffset(): number {
    const info = this.summary();
    return this.offsetAt(info.page + 1, info.pages);
  }

  lastOffset(): number {
    const info = this.summary();
    return this.offsetAt(info.pages - 1, info.pages);
  }

  private offsetAt(target: number, pages: number): number {
    const clamped = Math.max(0, Math.min(target, pages));
    return clamped * this.limit;
  }
}
