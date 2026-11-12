import type { Transport } from '../../http/request.ts';
import { JiraAddress } from '../helpers/jira-address.ts';

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
 * Probes candidate JIRA base addresses against v3 and v2 myself endpoints.
 */
export class JiraProbe implements AddressProbe {
  private readonly transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    Object.freeze(this);
  }

  normalize(raw: string): string {
    return new JiraAddress(raw).normalized();
  }

  candidates(raw: string): string[] {
    return new JiraAddress(raw).candidates();
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
