export interface WorkLogState {
  readonly id: string;
  readonly state: string;
  readonly timestamp: number;
}

export interface WorkLogEntry {
  readonly id: string;
  readonly started: boolean;
  readonly stopped: boolean;
  readonly duration: number;
  resume(): WorkLogEntry;
  start(): WorkLogEntry;
  stop(): WorkLogEntry;
  toJSON(): WorkLogState;
}

/**
 * Time-tracking session state for a single JIRA issue.
 */
export class TimerWorkLogEntry implements WorkLogEntry {
  private readonly identifier: string;
  private status: string;
  private epoch: number;

  constructor(id: string, state: string = 'STOPPED', timestamp: number = Date.now()) {
    if (state !== 'STOPPED' && state !== 'STARTED') {
      throw new TypeError(`Unknown timer state "${state}" for issue "${id}"`);
    }
    this.identifier = id;
    this.status = state;
    this.epoch = timestamp;
  }

  get id(): string {
    return this.identifier;
  }

  get started(): boolean {
    return this.status === 'STARTED';
  }

  get stopped(): boolean {
    return this.status === 'STOPPED';
  }

  get duration(): number {
    return Date.now() - this.epoch;
  }

  resume(): WorkLogEntry {
    this.status = 'STARTED';
    return this;
  }

  start(): WorkLogEntry {
    this.epoch = Date.now();
    this.status = 'STARTED';
    return this;
  }

  stop(): WorkLogEntry {
    this.status = 'STOPPED';
    return this;
  }

  toJSON(): WorkLogState {
    return { id: this.identifier, state: this.status, timestamp: this.epoch };
  }
}
