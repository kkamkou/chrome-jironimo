export interface AddressTarget {
  normalized(): string;
  candidates(): string[];
}

/**
 * JIRA server base address normalizer and path candidate sequence generator.
 */
export class JiraAddress implements AddressTarget {
  private readonly raw: string;

  constructor(raw: string) {
    this.raw = String(raw ?? '').trim();
    Object.freeze(this);
  }

  normalized(): string {
    if (!this.raw) {
      return '';
    }
    try {
      const parsed = new URL(this.raw);
      const cleaned = parsed.pathname
        .replace(/\/rest(?:\/.*)?$/i, '')
        .replace(/\/browse(?:\/.*)?$/i, '')
        .replace(/\/issues(?:\/.*)?$/i, '')
        .replace(/\/projects(?:\/.*)?$/i, '')
        .replace(/\/secure(?:\/.*)?$/i, '')
        .replace(
          /\/jira\/(?:software|your-work|core|servicedesk|dashboards|filters|people)(?:\/.*)?$/i,
          ''
        )
        .replace(/\/+$/, '');
      return `${parsed.origin}${cleaned}`;
    } catch {
      return this.raw.replace(/\/+$/, '');
    }
  }

  candidates(): string[] {
    const base = this.normalized();
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
}
