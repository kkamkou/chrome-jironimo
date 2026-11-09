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
            const url = String(config.url ?? '');
            if (
              (rej?.status === 404 || rej?.status === 405) &&
              (url.includes('/rest/api/3/') ||
                url.endsWith('/rest/api/2/search/jql') ||
                url.endsWith('/rest/api/2/search/approximate-count'))
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

export interface ProbeAttempt {
  baseUrl: string;
  version: 'v3' | 'v2';
  endpoint: string;
  status: 'pending' | 'ok' | 'unauthorized' | 'failed';
  code?: number;
  detail?: string;
}

export interface ProbeOutcome {
  matchedUrl: string | null;
  version: 'v3' | 'v2' | null;
  authenticated: boolean;
  user?: string;
  attempts: ProbeAttempt[];
}

export interface AddressProbe {
  normalize(raw: string): string;
  candidates(raw: string): string[];
  run(
    raw: string,
    timeout: number,
    progress?: (attempts: ProbeAttempt[]) => void
  ): Promise<ProbeOutcome>;
}

/**
 * Normalizes pasted JIRA links and probes candidate base addresses against v3 and v2 myself endpoints.
 */
export class JiraProbe implements AddressProbe {
  private readonly transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    Object.freeze(this);
  }

  normalize(raw: string): string {
    const trimmed = String(raw ?? '').trim();
    if (!trimmed) {
      return '';
    }
    try {
      const parsed = new URL(trimmed);
      const cleaned = parsed.pathname
        .replace(/\/rest(?:\/.*)?$/i, '')
        .replace(/\/browse(?:\/.*)?$/i, '')
        .replace(/\/issues(?:\/.*)?$/i, '')
        .replace(/\/projects(?:\/.*)?$/i, '')
        .replace(/\/secure(?:\/.*)?$/i, '')
        .replace(/\/jira\/(?:software|your-work|core|servicedesk|dashboards|filters|people)(?:\/.*)?$/i, '')
        .replace(/\/+$/, '');
      return `${parsed.origin}${cleaned}`;
    } catch {
      return trimmed.replace(/\/+$/, '');
    }
  }

  candidates(raw: string): string[] {
    const base = this.normalize(raw);
    if (!base) {
      return [];
    }
    try {
      const parsed = new URL(base);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const list: string[] = [];
      for (let idx = segments.length; idx >= 0; idx -= 1) {
        const prefix = segments.slice(0, idx).join('/');
        const candidate = prefix ? `${parsed.origin}/${prefix}` : parsed.origin;
        if (!list.includes(candidate)) {
          list.push(candidate);
        }
      }
      return list;
    } catch {
      return [base];
    }
  }

  async run(
    raw: string,
    timeout: number,
    progress: (attempts: ProbeAttempt[]) => void = () => undefined
  ): Promise<ProbeOutcome> {
    const attempts: ProbeAttempt[] = [];
    const versions: Array<['v3' | 'v2', string]> = [
      ['v3', '/rest/api/3/myself'],
      ['v2', '/rest/api/2/myself']
    ];
    for (const baseUrl of this.candidates(raw)) {
      for (const [version, path] of versions) {
        const attempt: ProbeAttempt = {
          baseUrl,
          version,
          endpoint: `${baseUrl}${path}`,
          status: 'pending'
        };
        attempts.push(attempt);
        progress([...attempts]);
        try {
          const res = await this.transport({
            method: 'GET',
            url: attempt.endpoint,
            timeout
          });
          const profile = res.data as Record<string, any> | null;
          const valid =
            Boolean(profile) &&
            typeof profile === 'object' &&
            ('active' in profile! || 'name' in profile! || 'accountId' in profile!);
          if (!valid) {
            attempt.status = 'failed';
            attempt.code = res.status;
            attempt.detail = `HTTP ${res.status}`;
            progress([...attempts]);
            continue;
          }
          if (profile!.active) {
            const user = String(
              profile!.displayName || profile!.name || profile!.emailAddress || 'Active'
            );
            attempt.status = 'ok';
            attempt.code = res.status;
            attempt.detail = user;
            progress([...attempts]);
            return { matchedUrl: baseUrl, version, authenticated: true, user, attempts };
          }
          attempt.status = 'unauthorized';
          attempt.code = res.status;
          attempt.detail = `HTTP ${res.status}`;
          progress([...attempts]);
          return { matchedUrl: baseUrl, version, authenticated: false, attempts };
        } catch (err: any) {
          const code = typeof err?.status === 'number' ? err.status : undefined;
          attempt.code = code;
          attempt.detail = code ? `HTTP ${code}` : 'Connection failed';
          if (code === 401 || code === 403) {
            attempt.status = 'unauthorized';
            progress([...attempts]);
            return { matchedUrl: baseUrl, version, authenticated: false, attempts };
          }
          attempt.status = 'failed';
          progress([...attempts]);
        }
      }
    }
    return { matchedUrl: null, version: null, authenticated: false, attempts };
  }
}
