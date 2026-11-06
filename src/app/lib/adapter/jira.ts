import type { HttpOrigin } from '../http/request.ts';
import { Response } from '../http/response.ts';

export type JiraCallback<T = any> = (err: (Error & { code?: number }) | null, data?: T) => void;

export interface JiraClient {
  authenticated(callback: (err: Error | null, flag: boolean) => void): void;
  myself(callback: JiraCallback): void;
  search(data: Record<string, unknown>, callback: JiraCallback): void;
  approximateCount(jql: string, callback: JiraCallback<{ count: number }>): void;
  filterFavourite(callback: JiraCallback): void;
  issueAssignee(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void;
  issueWorklog(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void;
  transitions(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void;
}

/**
 * Atlassian JIRA REST API client for a single configured server account.
 */
export class Jira implements JiraClient {
  private readonly request: HttpOrigin;
  private readonly url: string;
  private readonly timeout: number;
  private readonly cache: Record<string, unknown>;

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
    this.send('/api/3/myself', {}, (err, data) => {
      if (!err) {
        this.cache.myself = data;
      }
      callback(err, data);
    });
  }

  search(data: Record<string, unknown>, callback: JiraCallback): void {
    this.send('/api/3/search/jql', data, callback);
  }

  approximateCount(jql: string, callback: JiraCallback<{ count: number }>): void {
    this.send('/api/3/search/approximate-count', { _method: 'POST', jql }, callback);
  }

  filterFavourite(callback: JiraCallback): void {
    this.send('/api/3/filter/favourite', {}, callback);
  }

  issueAssignee(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.send(`/api/3/issue/${issueId}/assignee`, data, callback);
  }

  issueWorklog(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.send(`/api/3/issue/${issueId}/worklog?adjustEstimate=auto`, data, callback);
  }

  transitions(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.send(`/api/3/issue/${issueId}/transitions`, data, callback);
  }

  private send(urn: string, payload: Record<string, unknown>, callback: JiraCallback): void {
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
