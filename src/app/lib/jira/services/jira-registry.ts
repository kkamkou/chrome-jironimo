import { Jira, type JiraClient } from '../../adapter/jira.ts';
import { Request, type Transport } from '../../http/request.ts';
import type { AccountConfig } from '../../settings.ts';
import { type HttpFailure, JiraErrorFormatter } from '../helpers/error-diagnostics.ts';

export interface ClientRegistry {
  instance(account: AccountConfig): JiraClient;
}

/**
 * Caches and provides Jira API clients per Account using a shared HTTP transport.
 */
export class JiraRegistry implements ClientRegistry {
  private readonly transport: Transport;
  private readonly translate: (key: string) => string;
  private readonly fail: (status: string, messages: string[]) => void;
  private readonly cache: Record<string, JiraClient>;

  constructor(
    transport: Transport,
    translate: (key: string) => string,
    fail: (status: string, messages: string[]) => void = () => undefined
  ) {
    this.transport = transport;
    this.translate = translate;
    this.fail = fail;
    this.cache = {};
    Object.freeze(this);
  }

  instance(account: AccountConfig): JiraClient {
    if (!this.cache[account.id]) {
      const formatter = new JiraErrorFormatter(this.translate);
      this.cache[account.id] = new Jira(
        new Request(config =>
          this.transport(config).catch((rej: HttpFailure) => {
            const url = String(config.url ?? '');
            if (
              (rej?.status === 404 || rej?.status === 405) &&
              (url.includes('/rest/api/3/') ||
                url.endsWith('/rest/api/2/search/jql') ||
                url.endsWith('/rest/api/2/search/approximate-count') ||
                url.includes('/jql/parse'))
            ) {
              throw { ...rej, status: rej.status };
            }
            const heading =
              (rej?.status ? this.translate(`statusCode${rej.status}`) : '') ||
              (rej?.status ? `HTTP ${rej.status}` : this.translate('jiraApiConnectionProblem'));
            this.fail(heading, formatter.messages(rej));
            throw rej?.data || rej?.status ? rej : this.translate('jiraApiConnectionProblem');
          })
        ),
        account.url,
        account.timeout * 1000
      );
    }
    return this.cache[account.id];
  }
}
