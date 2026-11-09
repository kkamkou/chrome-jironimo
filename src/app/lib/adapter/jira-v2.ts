import { JiraBase, type JiraCallback } from './jira-base.ts';

/**
 * Atlassian JIRA REST API v2 client supporting Cloud JQL search, Server offset search, and plain-text worklogs.
 */
export class JiraV2 extends JiraBase {
  search(data: Record<string, unknown>, callback: JiraCallback): void {
    const legacy = { ...data };
    delete legacy.nextPageToken;
    if (this.cache.legacySearch) {
      this.send('/api/2/search', legacy, callback);
      return;
    }
    const modern = { ...data };
    delete modern.startAt;
    this.send('/api/2/search/jql', modern, (err, res) => {
      if (err && (err.code === 404 || err.code === 405)) {
        this.cache.legacySearch = true;
        this.send('/api/2/search', legacy, callback);
        return;
      }
      callback(err, res);
    });
  }

  approximateCount(jql: string, callback: JiraCallback<{ count: number }>): void {
    if (this.cache.legacySearch) {
      callback(null, { count: 0 });
      return;
    }
    this.send('/api/2/search/approximate-count', { _method: 'POST', jql }, (err, data) => {
      if (err && (err.code === 404 || err.code === 405)) {
        this.cache.legacySearch = true;
        callback(null, { count: 0 });
        return;
      }
      callback(err, data);
    });
  }

  issueWorklog(issueId: string | number, data: Record<string, unknown>, callback: JiraCallback): void {
    const text =
      typeof data.comment === 'object' && data.comment !== null
        ? String((data.comment as any).content?.[0]?.content?.[0]?.text ?? '')
        : data.comment;
    const payload = text !== undefined ? { ...data, comment: text } : data;
    this.send(`/api/2/issue/${issueId}/worklog?adjustEstimate=auto`, payload, callback);
  }

  protected prefix(): string {
    return '/api/2';
  }
}
