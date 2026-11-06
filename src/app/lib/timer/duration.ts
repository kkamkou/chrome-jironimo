export interface TimeSpan {
  badge(): string;
  humanize(): string;
  minutes(): number;
  seconds(): number;
}

/**
 * Elapsed time duration formatted for extension badges and JIRA worklog comments.
 */
export class Duration implements TimeSpan {
  private readonly milliseconds: number;

  constructor(milliseconds: number) {
    this.milliseconds = Math.max(0, Number(milliseconds) || 0);
    Object.freeze(this);
  }

  badge(): string {
    const total = Math.floor(this.milliseconds / 60000);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  humanize(): string {
    const secs = this.milliseconds / 1000;
    if (secs < 45) {
      return 'a few seconds';
    }
    if (secs < 90) {
      return 'a minute';
    }
    const mins = Math.round(secs / 60);
    if (mins < 45) {
      return `${mins} minutes`;
    }
    if (mins < 90) {
      return 'an hour';
    }
    const hours = Math.round(mins / 60);
    if (hours < 22) {
      return `${hours} hours`;
    }
    if (hours < 36) {
      return 'a day';
    }
    const days = Math.round(hours / 24);
    return `${days} days`;
  }

  minutes(): number {
    return Math.round(this.milliseconds / 60000);
  }

  seconds(): number {
    return this.milliseconds / 1000;
  }
}
