export interface HttpPayload {
  code(): number;
  toJson(): unknown;
}

/**
 * Immutable HTTP response envelope carrying status code and decoded payload.
 */
export class Response implements HttpPayload {
  private readonly body: unknown;
  private readonly status: number;

  constructor(data: unknown, code: number) {
    this.body = data;
    this.status = Number(code);
    Object.freeze(this);
  }

  code(): number {
    return this.status;
  }

  toJson(): unknown {
    return this.body;
  }
}
