import _ from 'lodash';

export type FetchPort = (input: string, init?: RequestInit) => Promise<globalThis.Response>;

export interface HttpTransport {
  send(config: Record<string, any>): Promise<{
    data: unknown;
    status: number;
    headers: Record<string, string>;
  }>;
}

/**
 * Browser fetch adapter supporting query parameters, credentials, timeouts, and JSON decoding.
 */
export class FetchTransport implements HttpTransport {
  private readonly port: FetchPort;

  constructor(port: FetchPort = (input, init) => fetch(input, init)) {
    this.port = port;
    Object.freeze(this);
  }

  async send(config: Record<string, any>): Promise<{
    data: unknown;
    status: number;
    headers: Record<string, string>;
  }> {
    const method = String(config.method ?? 'GET').toUpperCase();
    const target = this.url(String(config.url ?? ''), config.params);
    const timeout = Number(config.timeout) || 10000;
    const response = await this.port(target, {
      method,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Atlassian-Token': 'no-check',
        ...(config.headers ?? {})
      },
      body: method !== 'GET' && config.data !== undefined ? JSON.stringify(config.data) : undefined,
      signal: AbortSignal.timeout(timeout)
    });
    const text = await response.text();
    const data = this.parse(text);
    const headers: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });
    if (!response.ok) {
      throw { data, status: response.status, headers, config };
    }
    return { data, status: response.status, headers };
  }

  private url(base: string, params?: Record<string, unknown>): string {
    if (!params || !Object.keys(params).length) {
      return base;
    }
    const query = new URLSearchParams(_.mapValues(_.omitBy(params, _.isNil), String)).toString();
    return query ? `${base}${base.includes('?') ? '&' : '?'}${query}` : base;
  }

  private parse(text: string): unknown {
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
