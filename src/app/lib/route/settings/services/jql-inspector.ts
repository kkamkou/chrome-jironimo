import _ from 'lodash';
import type { ClientRegistry } from '../../../jira-api.ts';
import type { AccountConfig, WorkspaceConfig } from '../../../settings.ts';

export interface QueryVerification {
  validate(account: AccountConfig | undefined, query: string): Promise<boolean>;
  watchable(query: string | null): boolean;
  favorites(account: AccountConfig, existing: WorkspaceConfig[]): Promise<WorkspaceConfig[]>;
}

/**
 * Validates workspace JQL queries and imports favourite JIRA filters for an account.
 */
export class JqlInspector implements QueryVerification {
  private readonly jira: ClientRegistry;

  constructor(jira: ClientRegistry) {
    this.jira = jira;
    Object.freeze(this);
  }

  validate(account: AccountConfig | undefined, query: string): Promise<boolean> {
    if (!query || !account) {
      return Promise.resolve(false);
    }
    return new Promise(resolve => {
      this.jira.instance(account).validateJql(query, err => resolve(!err));
    });
  }

  watchable(query: string | null): boolean {
    return /\bupdated(date)?\b/.test(String(query ?? '').toLowerCase());
  }

  favorites(account: AccountConfig, existing: WorkspaceConfig[]): Promise<WorkspaceConfig[]> {
    return new Promise((resolve, reject) => {
      this.jira
        .instance(account)
        .filterFavourite((err, data: Array<{ jql: string; name: string }> = []) => {
          if (err) {
            reject(err);
            return;
          }
          const imported = _.uniqBy(data, 'jql')
            .filter(fav => !existing.some(ws => ws.query === fav.jql))
            .map(fav => ({
              account: account.id,
              icon: 'heart-2',
              query: fav.jql,
              title: fav.name
            }));
          resolve(imported);
        });
    });
  }
}
