import type { HttpOrigin } from '../http/request.ts';
import { JiraBase, type JiraCallback, type JiraClient } from './jira-base.ts';
import { JiraV2 } from './jira-v2.ts';
import { JiraV3 } from './jira-v3.ts';

export { JiraBase, type JiraCallback, type JiraClient, JiraV2, JiraV3 };

/**
 * Version-negotiating JIRA REST API client delegating to JiraV3 and falling back to JiraV2 on HTTP 404.
 */
export class Jira implements JiraClient {
  private readonly v3: JiraClient;
  private readonly v2: JiraClient;
  private readonly state: { active: 'v3' | 'v2' };

  constructor(request: HttpOrigin, url: string | null, timeout: number) {
    this.v3 = new JiraV3(request, url, timeout);
    this.v2 = new JiraV2(request, url, timeout);
    this.state = { active: 'v3' };
    Object.freeze(this);
  }

  authenticated(callback: (err: Error | null, flag: boolean) => void): void {
    this.myself((err, profile) => callback(null, !err && Boolean(profile && profile.active)));
  }

  myself(callback: JiraCallback): void {
    this.delegate((client, cb) => client.myself(cb), callback);
  }

  search(data: Record<string, unknown>, callback: JiraCallback): void {
    this.delegate((client, cb) => client.search(data, cb), callback);
  }

  approximateCount(jql: string, callback: JiraCallback<{ count: number }>): void {
    this.delegate((client, cb) => client.approximateCount(jql, cb), callback);
  }

  validateJql(jql: string, callback: JiraCallback): void {
    this.delegate((client, cb) => client.validateJql(jql, cb), callback);
  }

  filterFavourite(callback: JiraCallback): void {
    this.delegate((client, cb) => client.filterFavourite(cb), callback);
  }

  priorities(callback: JiraCallback): void {
    this.delegate((client, cb) => client.priorities(cb), callback);
  }

  issueAssignee(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.delegate((client, cb) => client.issueAssignee(issueId, data, cb), callback);
  }

  issueWorklog(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.delegate((client, cb) => client.issueWorklog(issueId, data, cb), callback);
  }

  transitions(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.delegate((client, cb) => client.transitions(issueId, data, cb), callback);
  }

  private delegate<T>(
    invoke: (client: JiraClient, cb: JiraCallback<T>) => void,
    callback: JiraCallback<T>
  ): void {
    if (this.state.active === 'v2') {
      invoke(this.v2, callback);
      return;
    }
    invoke(this.v3, (err, data) => {
      if (err && err.code === 404) {
        this.state.active = 'v2';
        invoke(this.v2, callback);
        return;
      }
      callback(err, data);
    });
  }
}
