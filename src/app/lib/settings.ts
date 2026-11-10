import _ from 'lodash';
import type { WorkLogState } from './timer/TimerWorkLogEntry.ts';

export interface JiraPriority {
  id: string | number;
  name?: string;
  statusColor?: string;
}

const METRO_PALETTE: Record<string, [number, number, number]> = {
  red: [229, 20, 0],
  lightRed: [255, 45, 25],
  crimson: [162, 0, 37],
  orange: [250, 104, 0],
  amber: [240, 163, 10],
  yellow: [227, 200, 0],
  lime: [164, 196, 0],
  lightOlive: [120, 170, 28],
  green: [96, 169, 23],
  emerald: [0, 138, 0],
  teal: [0, 171, 169],
  cyan: [27, 161, 226],
  lightBlue: [67, 144, 223],
  blue: [0, 175, 240],
  cobalt: [0, 80, 239],
  darkCobalt: [0, 53, 106],
  darkBlue: [22, 73, 154],
  indigo: [106, 0, 255],
  violet: [170, 0, 255],
  pink: [220, 79, 173],
  magenta: [216, 0, 115],
  steel: [100, 118, 135],
  mauve: [118, 96, 138],
  taupe: [135, 121, 78],
  brown: [130, 90, 44],
  olive: [109, 135, 100],
  gray: [85, 85, 85],
  dark: [51, 51, 51],
  darker: [34, 34, 34]
};

export interface AccountConfig {
  enabled: boolean;
  id: string;
  label: string;
  timeout: number;
  type: string;
  url: string | null;
}

export interface PriorityColor {
  fg: string;
  bg: string;
  bd: string;
  ot: string;
  label?: string;
  rank?: number;
}

export interface ColorsConfig {
  theme: string;
  sizes: Record<string, string>;
  priority: Record<number | string, PriorityColor>;
  accounts?: Record<string, Record<string, PriorityColor>>;
}

export interface WorkspaceConfig {
  account: string;
  icon: string;
  title: string | null;
  query: string | null;
  changesNotify?: boolean;
  changesNotifyPersistent?: boolean;
}

export interface TimerConfig {
  enabled: boolean;
  workspace: number;
  singleton: boolean;
}

export interface AccountActivity {
  enabled?: boolean;
  index: number;
  searchMaxResults: number;
  timers: Record<string, WorkLogState>;
}

export interface ActivityConfig {
  lastAccount: number;
  workspace: Record<string, AccountActivity>;
}

export interface GeneralConfig {
  sync: boolean;
}

export interface SettingsStore {
  version: number;
  general: GeneralConfig;
  accounts: AccountConfig[];
  colors: ColorsConfig;
  workspaces: WorkspaceConfig[];
  timer: TimerConfig;
  activity: ActivityConfig;
  getUriSettings(): string;
  getUriFeedback(): string;
  getStorageData(): Record<string, string>;
  setStorageData(items: Record<string, string>): SettingsStore;
  samplePriorities(items: JiraPriority[]): Record<string, PriorityColor>;
  moveWorkspace(workspaces: WorkspaceConfig[], index: number, offset: number): WorkspaceConfig[];
}

/**
 * Persistent extension configuration backed by localStorage and optional Chrome sync callback.
 */
export class Settings implements SettingsStore {
  private readonly store: Record<string, string>;
  private readonly translate: (key: string) => string;
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
    this.translate = translate;
    this.syncer = syncer;
    this.migrate();
  }

  get version(): number {
    return this.read('version', 600);
  }

  set version(val: number) {
    this.write('version', val);
  }

  get general(): GeneralConfig {
    return this.read('general', { sync: true });
  }

  set general(val: GeneralConfig) {
    this.write('general', val);
  }

  get accounts(): AccountConfig[] {
    return this.read('accounts', [
      { enabled: false, id: 'default', label: 'Default', timeout: 10, type: 'basic', url: null }
    ]);
  }

  set accounts(val: AccountConfig[]) {
    this.write('accounts', val);
  }

  get colors(): ColorsConfig {
    return this.read('colors', {
      theme: 'default',
      sizes: {
        epic: 'triple',
        story: 'double',
        task: 'default',
        'sub-task': 'default',
        bug: 'default',
        improvement: 'default'
      },
      priority: {
        1: { fg: 'white', bg: 'red', bd: 'white', ot: 'red' },
        2: { fg: 'white', bg: 'orange', bd: 'white', ot: 'orange' },
        3: { fg: 'white', bg: 'lightOlive', bd: 'white', ot: 'lightOlive' },
        4: { fg: 'white', bg: 'gray', bd: 'white', ot: 'gray' },
        5: { fg: 'white', bg: 'cyan', bd: 'white', ot: 'lightBlue' },
        6: { fg: 'white', bg: 'lightBlue', bd: 'white', ot: 'lightBlue' }
      }
    });
  }

  set colors(val: ColorsConfig) {
    this.write('colors', val);
  }

  get workspaces(): WorkspaceConfig[] {
    return this.read('workspaces', [
      {
        account: 'ALL',
        icon: 'share-2',
        title: this.translate('settingsWorkspaceCreatedByMe'),
        query: 'reporter = currentUser() ORDER BY created DESC',
        changesNotify: true,
        changesNotifyPersistent: false
      },
      {
        account: 'ALL',
        icon: 'target',
        title: this.translate('settingsWorkspaceMyIssues'),
        query:
          'assignee = currentUser() AND status not in (Closed, Resolved)' +
          ' ORDER BY updatedDate DESC',
        changesNotify: true,
        changesNotifyPersistent: false
      },
      {
        account: 'ALL',
        icon: 'eye-2',
        title: this.translate('settingsWorkspaceWatching'),
        query:
          '(' +
          'assignee = currentUser() OR assignee was currentUser() OR reporter = currentUser()' +
          ') AND status not in (Closed, Resolved) ORDER BY updated DESC',
        changesNotify: true,
        changesNotifyPersistent: false
      }
    ]);
  }

  set workspaces(val: WorkspaceConfig[]) {
    this.write('workspaces', val);
  }

  get timer(): TimerConfig {
    return this.read('timer', { enabled: true, workspace: 5, singleton: true });
  }

  set timer(val: TimerConfig) {
    this.write('timer', val);
  }

  get activity(): ActivityConfig {
    return this.read('activity', {
      lastAccount: 0,
      workspace: { default: { index: 0, searchMaxResults: 16, timers: {} } }
    });
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
    const counts = _.countBy(items, item => String(item.statusColor ?? '').trim().toLowerCase());
    return _.fromPairs(
      items.map((item, idx) => {
        const rawColor = String(item.statusColor ?? '').trim().toLowerCase();
        const rgb = this.parseHex(rawColor);
        const tone =
          (rgb && counts[rawColor] === 1 ? this.closestMetro(rgb) : null) ??
          this.semanticMetro(String(item.name ?? '')) ??
          (rgb ? this.closestMetro(rgb) : null) ??
          this.colors.priority[idx + 1]?.bg ??
          'gray';
        return [
          String(item.id),
          {
            fg: tone === 'yellow' ? 'black' : 'white',
            bg: tone,
            bd: 'white',
            ot: tone,
            label: item.name,
            rank: idx + 1
          }
        ];
      })
    );
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

  private parseHex(hex: string): [number, number, number] | null {
    const clean = hex.replace(/^#/, '');
    const full =
      clean.length === 3
        ? clean
            .split('')
            .map(ch => ch + ch)
            .join('')
        : clean;
    if (!/^[0-9a-f]{6}$/i.test(full)) {
      return null;
    }
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16)
    ];
  }

  private closestMetro([r, g, b]: [number, number, number]): string {
    return (
      _.minBy(Object.keys(METRO_PALETTE), key => {
        const [mr, mg, mb] = METRO_PALETTE[key];
        const rmean = (r + mr) / 2;
        const dr = r - mr;
        const dg = g - mg;
        const db = b - mb;
        return (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db;
      }) ?? 'gray'
    );
  }

  private semanticMetro(name: string): string | null {
    const lower = name.toLowerCase();
    if (/blocker|highest|critical|urgent|emergency|\bp[01]\b|\bsev[01]\b/.test(lower)) {
      return 'red';
    }
    if (/\bhigh\b|major|important|\bp2\b|\bsev2\b/.test(lower)) {
      return 'orange';
    }
    if (/medium|normal|standard|average|\bp3\b|\bsev3\b/.test(lower)) {
      return 'lightOlive';
    }
    if (/\blow\b|minor|secondary|\bp4\b|\bsev4\b/.test(lower)) {
      return 'gray';
    }
    if (/lowest|trivial|cosmetic|minimal|\bp5\b|\bsev5\b/.test(lower)) {
      return 'lightBlue';
    }
    return null;
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

  private migrate(): void {
    if (this.version >= 600) {
      return;
    }
    if (Array.isArray(this.workspaces)) {
      this.workspaces = this.workspaces.map(workspace => ({ ...workspace, account: 'ALL' }));
    }
    const base: AccountConfig = {
      enabled: true,
      id: 'default',
      label: 'Default',
      timeout: 10,
      type: 'basic',
      url: null
    };
    this.accounts = [base];
    const current = this.activity;
    current.workspace.default = {
      enabled: true,
      index: Number(this.store.workspaceLast) || 0,
      searchMaxResults: 16,
      timers: this.store.timers ? JSON.parse(this.store.timers) : {}
    };
    this.activity = current;
    const legacy = this.store.account ? JSON.parse(this.store.account) : null;
    if (legacy && legacy.url) {
      this.general = { sync: Boolean(legacy.sync) || true };
      this.accounts = [{ ...base, url: legacy.url, timeout: Number(legacy.timeout) || 10 }];
    }
    delete this.store.workspaceLast;
    delete this.store.timers;
    delete this.store.account;
    this.version = 600;
  }
}
