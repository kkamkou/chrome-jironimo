import type { WorkLogState } from '../../timer/TimerWorkLogEntry.ts';

export interface JiraPriority {
  id: string | number;
  name?: string;
  statusColor?: string;
}

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
