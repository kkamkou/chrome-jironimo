import type {
  AccountConfig,
  ActivityConfig,
  ColorsConfig,
  GeneralConfig,
  TimerConfig,
  WorkspaceConfig
} from './settings-types.ts';

export interface DefaultCatalog {
  general(): GeneralConfig;
  accounts(): AccountConfig[];
  colors(): ColorsConfig;
  workspaces(): WorkspaceConfig[];
  timer(): TimerConfig;
  activity(): ActivityConfig;
}

/**
 * Provides default configuration structures for uninitialized storage keys.
 */
export class SettingsDefaults implements DefaultCatalog {
  private readonly translate: (key: string) => string;

  constructor(translate: (key: string) => string) {
    this.translate = translate;
    Object.freeze(this);
  }

  general(): GeneralConfig {
    return { sync: true };
  }

  accounts(): AccountConfig[] {
    return [
      { enabled: false, id: 'default', label: 'Default', timeout: 10, type: 'basic', url: null }
    ];
  }

  colors(): ColorsConfig {
    return {
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
    };
  }

  workspaces(): WorkspaceConfig[] {
    return [
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
    ];
  }

  timer(): TimerConfig {
    return { enabled: true, workspace: 5, singleton: true };
  }

  activity(): ActivityConfig {
    return {
      lastAccount: 0,
      workspace: { default: { index: 0, searchMaxResults: 16, timers: {} } }
    };
  }
}
