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
      if (
        typeof Image === 'function' &&
        JSON.parse(this.target.localStorage?.getItem('general') || '{}').submitExceptions
      ) {
        const summary = err instanceof Error ? err.message : String(err);
        new Image().src = `https://2ka.by/examples/chrome-jironimo.php?err=${encodeURIComponent(summary)}`;
      }
    };
  }
}

if (typeof window !== 'undefined') {
  new ExceptionMonitor(window).install();
}
