import { Jira, type JiraClient } from './adapter/jira.ts';
import { Request, type Transport } from './http/request.ts';
import type { AccountConfig } from './settings.ts';

export interface HttpFailure {
  status?: number;
  headers?: Record<string, string | undefined>;
  data?: any;
  config?: { url?: string };
}

export interface ErrorDiagnostics {
  messages(rejection: HttpFailure): string[];
}

/**
 * Translates JIRA HTTP failure responses into localized error messages.
 */
export class JiraErrorFormatter implements ErrorDiagnostics {
  private readonly translate: (key: string) => string;

  constructor(translate: (key: string) => string) {
    this.translate = translate;
    Object.freeze(this);
  }

  messages(rejection: HttpFailure): string[] {
    if (!rejection || !rejection.status) {
      return [this.translate('jiraApiConnectionProblem')];
    }
    const headers = rejection.headers ?? {};
    const reasons: Record<string, string> = {
      AUTHENTICATION_DENIED: 'jiraApiAuthenticationDenied',
      AUTHENTICATED_FAILED: 'jiraApiAuthenticationFailed',
      AUTHORISATION_FAILED: 'jiraApiAuthorizationFailed',
      OUT: 'jiraApiLoggedOut'
    };
    const denied = headers['x-authentication-denied-reason'];
    const reason = headers['x-seraph-loginreason'];
    if (denied) {
      return [denied];
    }
    if (reason && rejection.status > 400 && rejection.status < 500) {
      return [this.translate(reasons[reason])];
    }
    if (rejection.status === 500) {
      return [this.translate('jiraApiCheckConfig')];
    }
    if (rejection.data && Array.isArray(rejection.data.errorMessages)) {
      return rejection.data.errorMessages;
    }
    if (rejection.data && rejection.data.message) {
      return [String(rejection.data.message)];
    }
    return [this.translate('jiraApiUknownResponse'), this.translate('jiraApiCheckSettings')];
  }
}

/**
 * Caches and provides Jira API clients per Account using a shared HTTP transport.
 */
export class JiraRegistry {
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
            try {
              if (typeof window !== 'undefined' && typeof window.onerror === 'function') {
                const parts = String(rej?.config?.url ?? '').split('/rest/');
                (window.onerror as (err: unknown) => void)({
                  status: rej?.status,
                  data: rej?.data,
                  url: parts.slice(1).join('/')
                });
              }
            } catch {}
            const heading =
              (rej?.status ? this.translate(`statusCode${rej.status}`) : '') ||
              (rej?.status ? `HTTP ${rej.status}` : this.translate('jiraApiConnectionProblem'));
            this.fail(heading, formatter.messages(rej));
            throw rej?.data ? rej : this.translate('jiraApiConnectionProblem');
          })
        ),
        account.url,
        account.timeout * 1000
      );
    }
    return this.cache[account.id];
  }
}
