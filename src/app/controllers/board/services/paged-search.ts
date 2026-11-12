import type { JiraClient } from '../../../lib/adapter/jira.ts';

export interface SearchSlice {
  page: number;
  data: any;
  approxCount?: number;
  startAt: number;
  total: number;
}

export interface IssuePages {
  reset(): void;
  page(
    api: JiraClient,
    jql: string,
    limit: number,
    targetPage: number,
    searchTotal: number,
    jumpToEnd: boolean
  ): Promise<SearchSlice>;
  single(api: JiraClient, jql: string, limit: number): Promise<any>;
}

/**
 * Resolves token-paged and offset-paged JIRA issue searches with approximate total counts.
 */
export class PagedSearch implements IssuePages {
  private readonly state: { tokens: Array<string | undefined> };

  constructor() {
    this.state = { tokens: [undefined] };
    Object.freeze(this);
  }

  reset(): void {
    this.state.tokens = [undefined];
  }

  async page(
    api: JiraClient,
    jql: string,
    limit: number,
    targetPage: number,
    searchTotal: number,
    jumpToEnd: boolean
  ): Promise<SearchSlice> {
    await this.ensureMyself(api);
    const countPromise =
      targetPage === 0 && searchTotal === 0
        ? this.fetchApproximateCount(api, jql)
        : Promise.resolve(undefined);
    const offsetBased = searchTotal > 0 && !this.state.tokens[1];
    let step = targetPage;
    if (!offsetBased) {
      while (step > 0 && !this.state.tokens[step]) {
        step -= 1;
      }
      while (step < targetPage) {
        const cursorData = await this.searchPage(api, jql, limit, this.state.tokens[step], true);
        if (!cursorData.nextPageToken) {
          targetPage = step;
          break;
        }
        this.state.tokens[step + 1] = cursorData.nextPageToken;
        step += 1;
      }
    }
    let data = await this.searchPage(
      api,
      jql,
      limit,
      this.state.tokens[step],
      false,
      offsetBased ? step * limit : 0
    );
    if (data.nextPageToken) {
      this.state.tokens[step + 1] = data.nextPageToken;
    }
    while (jumpToEnd && data.nextPageToken) {
      step += 1;
      data = await this.searchPage(api, jql, limit, this.state.tokens[step], false);
      if (data.nextPageToken) {
        this.state.tokens[step + 1] = data.nextPageToken;
      }
    }
    const approxCount = await countPromise;
    const resolvedOffset = step * limit;
    const startAt = data.startAt ?? resolvedOffset;
    const count = Array.isArray(data.issues) ? data.issues.length : 0;
    const total = this.resolveTotal(data, approxCount, resolvedOffset, limit, count, searchTotal);
    return { page: step, data, approxCount, startAt, total };
  }

  single(api: JiraClient, jql: string, limit: number): Promise<any> {
    return this.ensureMyself(api).then(() => this.searchPage(api, jql, limit, undefined, false));
  }

  private resolveTotal(
    data: any,
    approxCount: number | undefined,
    resolvedOffset: number,
    limit: number,
    count: number,
    previousTotal: number
  ): number {
    if (typeof data.total === 'number') {
      return data.total;
    }
    if (!data.nextPageToken) {
      return resolvedOffset + count;
    }
    if (typeof approxCount === 'number' && approxCount > 0) {
      return Math.max(approxCount, resolvedOffset + limit + 1);
    }
    return Math.max(previousTotal, resolvedOffset + limit + count);
  }

  private ensureMyself(api: JiraClient): Promise<void> {
    return new Promise((resolve, reject) => {
      api.myself((err, flag) => {
        if (err || !flag) {
          reject(err || new Error('Unable to identify myself'));
          return;
        }
        resolve();
      });
    });
  }

  private searchPage(
    api: JiraClient,
    jql: string,
    limit: number,
    nextPageToken: string | undefined,
    idsOnly: boolean,
    startAt = 0
  ): Promise<any> {
    const query: Record<string, unknown> = {
      jql,
      maxResults: Number(limit) || 10,
      fields: idsOnly ? 'id' : '*navigable'
    };
    if (!idsOnly) {
      query.expand = 'transitions';
    }
    if (nextPageToken) {
      query.nextPageToken = nextPageToken;
    } else if (startAt > 0) {
      query.startAt = startAt;
    }
    return new Promise((resolve, reject) => {
      api.search(query, (err, data) => (err ? reject(err) : resolve(data)));
    });
  }

  private fetchApproximateCount(api: JiraClient, jql: string): Promise<number | undefined> {
    return new Promise(resolve => {
      api.approximateCount(jql, (err, data) => {
        resolve(!err && typeof data?.count === 'number' ? data.count : undefined);
      });
    });
  }
}
