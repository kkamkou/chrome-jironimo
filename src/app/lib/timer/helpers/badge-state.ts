import type { SettingsStore } from '../../settings.ts';
import { Duration } from '../duration.ts';

export interface BadgeLabel {
  text(): string;
}

/**
 * Extension badge text calculated from active workspace timers across all accounts.
 */
export class BadgeState implements BadgeLabel {
  private readonly settings: SettingsStore;

  constructor(settings: SettingsStore) {
    this.settings = settings;
    Object.freeze(this);
  }

  text(): string {
    const entries = Object.values(this.settings.activity.workspace).flatMap(ws =>
      Object.values(ws?.timers ?? {})
    );
    if (entries.length < 1) {
      return '';
    }
    if (entries.length > 1) {
      return String(entries.length);
    }
    return new Duration(Date.now() - entries[0].timestamp).badge();
  }
}
