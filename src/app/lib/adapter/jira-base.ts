import type { HttpOrigin } from '../http/request.ts';
import { Response } from '../http/response.ts';

export type JiraCallback<T = any> = (err: (Error & { code?: number }) | null, data?: T) => void;

export interface JiraClient {
  authenticated(callback: (err: Error | null, flag: boolean) => void): void;
  myself(callback: JiraCallback): void;
  search(data: Record<string, unknown>, callback: JiraCallback): void;
  approximateCount(jql: string, callback: JiraCallback<{ count: number }>): void;
  filterFavourite(callback: JiraCallback): void;
  priorities(callback: JiraCallback): void;
  issueAssignee(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void;
  issueWorklog(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void;
  transitions(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void;
}

/**
 * Shared Atlassian JIRA REST API base client providing version-prefixed resource calls and transport dispatch.
 */
export abstract class JiraBase implements JiraClient {
  protected readonly request: HttpOrigin;
  protected readonly url: string;
  protected readonly timeout: number;
  protected readonly cache: Record<string, unknown>;

  constructor(request: HttpOrigin, url: string | null, timeout: number) {
    this.request = request;
    this.url = String(url ?? '');
    this.timeout = parseInt(String(timeout), 10) || 10000;
    this.cache = {};
    Object.freeze(this);
  }

  authenticated(callback: (err: Error | null, flag: boolean) => void): void {
    this.myself((err, profile) => callback(null, !err && Boolean(profile && profile.active)));
  }

  myself(callback: JiraCallback): void {
    if (this.cache.myself) {
      callback(null, this.cache.myself);
      return;
    }
    this.send(`${this.prefix()}/myself`, {}, (err, data) => {
      if (!err) {
        this.cache.myself = data;
      }
      callback(err, data);
    });
  }

  filterFavourite(callback: JiraCallback): void {
    this.send(`${this.prefix()}/filter/favourite`, {}, callback);
  }

  priorities(callback: JiraCallback): void {
    this.send(`${this.prefix()}/priority`, {}, callback);
  }

  issueAssignee(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.send(`${this.prefix()}/issue/${issueId}/assignee`, data, callback);
  }

  transitions(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.send(`${this.prefix()}/issue/${issueId}/transitions`, data, callback);
  }

  abstract search(data: Record<string, unknown>, callback: JiraCallback): void;

  abstract approximateCount(jql: string, callback: JiraCallback<{ count: number }>): void;

  abstract issueWorklog(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void;

  protected abstract prefix(): string;

  protected send(urn: string, payload: Record<string, unknown>, callback: JiraCallback): void {
    const copy = { ...payload };
    const method = typeof copy._method === 'string' ? copy._method.toUpperCase() : 'GET';
    delete copy._method;
    const options: Record<string, unknown> = {
      method,
      url: `${this.url}/rest${urn}`,
      cache: false,
      responseType: 'json',
      timeout: this.timeout
    };
    if (method === 'GET') {
      options.params = copy;
    } else {
      options.data = copy;
    }
    this.request
      .fetch(options)
      .then(res => callback(null, res.toJson()))
      .catch(reason => {
        if (reason instanceof Response) {
          const error = new Error(String(reason.toJson())) as Error & { code?: number };
          error.code = reason.code();
          callback(error);
          return;
        }
        callback(reason instanceof Error ? reason : new Error(String(reason)));
      });
  }
}
