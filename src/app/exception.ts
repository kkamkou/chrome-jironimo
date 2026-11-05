/**
 * Global uncaught exception reporter forwarding errors when enabled in settings.
 */
export class ExceptionMonitor {
  private readonly target: Window & typeof globalThis;

  constructor(target: Window & typeof globalThis = window) {
    this.target = target;
    Object.freeze(this);
  }

  install(): void {
    this.target.onerror = (err: unknown) => {
      if (JSON.parse(this.target.localStorage?.getItem('general') || '{}').submitExceptions) {
        new Image().src = `http://2ka.by/examples/chrome-jironimo.php?err=${JSON.stringify(err)}`;
      }
    };
  }
}

if (typeof window !== 'undefined') {
  new ExceptionMonitor(window).install();
}
