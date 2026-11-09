import { JiraBase, type JiraCallback } from './jira-base.ts';

/**
 * Atlassian JIRA REST API v3 client using JQL token search and ADF worklog comments.
 */
export class JiraV3 extends JiraBase {
  search(data: Record<string, unknown>, callback: JiraCallback): void {
    const payload = { ...data };
    delete payload.startAt;
    this.send('/api/3/search/jql', payload, callback);
  }

  approximateCount(jql: string, callback: JiraCallback<{ count: number }>): void {
    this.send('/api/3/search/approximate-count', { _method: 'POST', jql }, callback);
  }

  issueWorklog(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    this.send(`/api/3/issue/${issueId}/worklog?adjustEstimate=auto`, data, callback);
  }

  protected prefix(): string {
    return '/api/3';
  }
}
