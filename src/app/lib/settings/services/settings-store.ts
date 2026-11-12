import { MetroPalette } from '../helpers/metro-palette.ts';
import { type DefaultCatalog, SettingsDefaults } from '../helpers/settings-defaults.ts';
import { SettingsMigration } from '../helpers/settings-migration.ts';
import type {
  AccountConfig,
  ActivityConfig,
  ColorsConfig,
  GeneralConfig,
  JiraPriority,
  PriorityColor,
  SettingsStore,
  TimerConfig,
  WorkspaceConfig
} from '../helpers/settings-types.ts';

/**
 * Persistent extension configuration backed by localStorage and optional Chrome sync callback.
 */
export class Settings implements SettingsStore {
  private readonly store: Record<string, string>;
  private readonly defaults: DefaultCatalog;
  private readonly syncer: (payload: Record<string, string>) => void;

  constructor(
    store: Record<string, string> = typeof localStorage !== 'undefined'
      ? (localStorage as unknown as Record<string, string>)
      : {},
    translate: (key: string) => string = key =>
      typeof chrome !== 'undefined' && chrome.i18n ? chrome.i18n.getMessage(key) : key,
    syncer: (payload: Record<string, string>) => void = payload => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local?.set(payload);
        chrome.storage.sync?.set(payload);
      }
    }
  ) {
    this.store = store;
    this.defaults = new SettingsDefaults(translate);
    this.syncer = syncer;
    new SettingsMigration(this.store).upgrade(this);
  }

  get version(): number {
    return this.read('version', 600);
  }

  set version(val: number) {
    this.write('version', val);
  }

  get general(): GeneralConfig {
    return this.read('general', this.defaults.general());
  }

  set general(val: GeneralConfig) {
    this.write('general', val);
  }

  get accounts(): AccountConfig[] {
    return this.read('accounts', this.defaults.accounts());
  }

  set accounts(val: AccountConfig[]) {
    this.write('accounts', val);
  }

  get colors(): ColorsConfig {
    return this.read('colors', this.defaults.colors());
  }

  set colors(val: ColorsConfig) {
    this.write('colors', val);
  }

  get workspaces(): WorkspaceConfig[] {
    return this.read('workspaces', this.defaults.workspaces());
  }

  set workspaces(val: WorkspaceConfig[]) {
    this.write('workspaces', val);
  }

  get timer(): TimerConfig {
    return this.read('timer', this.defaults.timer());
  }

  set timer(val: TimerConfig) {
    this.write('timer', val);
  }

  get activity(): ActivityConfig {
    return this.read('activity', this.defaults.activity());
  }

  set activity(val: ActivityConfig) {
    this.write('activity', val);
  }

  getUriSettings(): string {
    return 'views/default.html#/settings/general';
  }

  getUriFeedback(): string {
    return (
      'https://docs.google.com/forms/d/17O-B8lTvqvsLIgsLrUJjOJ_1arlDFkPYZ4UAuFv7zDo' +
      '/viewform?usp=send_form'
    );
  }

  getStorageData(): Record<string, string> {
    return { ...this.store };
  }

  setStorageData(items: Record<string, string>): SettingsStore {
    Object.keys(items).forEach(key => {
      this.store[key] = items[key];
    });
    return this;
  }

  samplePriorities(items: JiraPriority[]): Record<string, PriorityColor> {
    return new MetroPalette(this.colors.priority).sample(items);
  }

  moveWorkspace(workspaces: WorkspaceConfig[], index: number, offset: number): WorkspaceConfig[] {
    const target = index + offset;
    if (index < 0 || target < 0 || index >= workspaces.length || target >= workspaces.length) {
      return workspaces;
    }
    const reordered = [...workspaces];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    return reordered;
  }

  private read<T>(name: string, fallback: T): T {
    if (!this.store[name] && fallback !== undefined) {
      this.store[name] = JSON.stringify(fallback);
    }
    return this.store[name] ? (JSON.parse(this.store[name]) as T) : fallback;
  }

  private write(name: string, val: unknown): void {
    this.store[name] = JSON.stringify(val);
    this.syncer({ [name]: this.store[name] });
  }
}
