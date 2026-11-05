import { type HttpPayload, Response } from './response.ts';

export type Transport = (params: Record<string, unknown>) => Promise<{
  data: unknown;
  status: number;
  headers?: Record<string, string>;
}>;

export interface HttpOrigin {
  fetch(params: Record<string, unknown>): Promise<HttpPayload>;
}

/**
 * HTTP request dispatcher wrapping transport outcomes into Response objects.
 */
export class Request implements HttpOrigin {
  private readonly transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    Object.freeze(this);
  }

  fetch(params: Record<string, unknown>): Promise<HttpPayload> {
    return this.transport(params).then(
      outcome => new Response(outcome.data, outcome.status),
      failure => {
        throw new Response(
          failure && typeof failure === 'object' && 'data' in failure && failure.data
            ? failure.data
            : failure,
          failure && typeof failure === 'object' && 'status' in failure && failure.status
            ? Number(failure.status)
            : -1
        );
      }
    );
  }
}
