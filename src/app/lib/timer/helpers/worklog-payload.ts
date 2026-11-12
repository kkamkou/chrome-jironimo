import type { TimeSpan } from '../duration.ts';

export interface IssueSummary {
  id: string;
  key?: string;
  fields: {
    status: {
      name?: string;
      iconUrl?: string;
    };
    reporter?: {
      displayName?: string;
    };
    summary?: string;
    timeestimate?: string | number;
    issuetype: {
      name?: string;
    };
    priority?: {
      id?: number | string;
    };
    progress?: {
      percent: number;
    };
    assignee?: unknown;
    [key: string]: any;
  };
  transitions?: Array<{ id: string; name: string }>;
  [key: string]: any;
}

export interface WorklogDocument {
  body(): Record<string, unknown>;
}

/**
 * Formats an elapsed TimeSpan into an Atlassian Document Format worklog submission payload.
 */
export class WorklogPayload implements WorklogDocument {
  private readonly span: TimeSpan;

  constructor(span: TimeSpan) {
    this.span = span;
    Object.freeze(this);
  }

  body(): Record<string, unknown> {
    return {
      _method: 'POST',
      comment: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: this.span.humanize() }]
          }
        ]
      },
      timeSpent: `${this.span.minutes()}m`
    };
  }
}
