import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import _ from 'lodash';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { Divider } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FetchTransport } from '../lib/http/fetch-transport.ts';
import { JiraRegistry } from '../lib/jira-api.ts';
import {
  type AccountConfig,
  type ColorsConfig,
  type JiraPriority,
  type PriorityColor,
  Settings,
  type TimerConfig
} from '../lib/settings.ts';
import { NavigationComponent } from '../shared/directive/navigation.ts';
import { I18nPipe } from '../shared/filter/i18n.ts';

/**
 * Colors and tile sizing settings view.
 */
@Component({
  selector: 'jironimo-settings-colors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    ButtonGroup,
    InputText,
    Message,
    Select,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    I18nPipe,
    NavigationComponent
  ],
  templateUrl: '../../views/options-colors.html'
})
export class ColorsSettingsComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly settings = new Settings();
  private readonly i18n = new I18nPipe();
  private readonly jira = new JiraRegistry(
    cfg => new FetchTransport().send(cfg),
    key => this.i18n.transform(key)
  );
  colors: ColorsConfig = this.settings.colors;
  accounts: AccountConfig[] = this.settings.accounts.filter(acc => acc.enabled);
  accountSelected: AccountConfig | 'ALL' = 'ALL';
  samplingPriorities = false;
  tabControl = { colors: 'theme' };
  readonly colorFrames = [
    { key: 'theme', title: 'settingsColorsDefaultTheme' },
    { key: 'colors', title: 'settingsColorsPriorityColors' },
    { key: 'sizes', title: 'settingsColorsPrioritySizes' }
  ];
  readonly themeOptions = [{ label: 'Jironimo', value: 'default' }];
  readonly sizeOptions = [
    { label: `${this.i18n.transform('settingsColorsSizeHalf')} (55×55)`, value: 'half' },
    { label: `${this.i18n.transform('settingsColorsSizeDefault')} (120×120)`, value: 'default' },
    { label: `${this.i18n.transform('settingsColorsSizeDouble')} (250×120)`, value: 'double' },
    { label: `${this.i18n.transform('settingsColorsSizeTriple')} (380×120)`, value: 'triple' },
    { label: `${this.i18n.transform('settingsColorsSizeQuadruple')} (510×120)`, value: 'quadro' }
  ];
  readonly sizeKeys = Object.keys(this.colors.sizes);

  accountSwitch(target: AccountConfig | 'ALL'): void {
    this.accountSelected = target;
    this.cdr.markForCheck();
  }

  activePriorities(): Record<string, PriorityColor> {
    if (this.accountSelected === 'ALL') {
      return this.colors.priority as Record<string, PriorityColor>;
    }
    return this.colors.accounts?.[this.accountSelected.id] ?? {};
  }

  activePriorityKeys(): string[] {
    const map = this.activePriorities();
    return _.sortBy(Object.keys(map), key => map[key].rank ?? Number(key));
  }

  samplePriorities(): void {
    if (this.accountSelected === 'ALL') {
      return;
    }
    const selected = this.accountSelected;
    this.samplingPriorities = true;
    this.jira
      .instance(selected)
      .priorities((err, data: JiraPriority[] = []) => {
        if (err) {
          this.messageService.clear();
          this.messageService.add({ severity: 'error', summary: 'Jironimo', detail: String(err) });
          this.samplingPriorities = false;
          this.cdr.markForCheck();
          return;
        }
        this.colors.accounts = {
          ...(this.colors.accounts ?? {}),
          [selected.id]: this.settings.samplePriorities(data)
        };
        this.samplingPriorities = false;
        this.messageService.clear();
        this.messageService.add({
          severity: 'success',
          summary: 'Jironimo',
          detail: this.i18n.transform('msgPrioritySampleSuccess', [data.length])
        });
        this.cdr.markForCheck();
      });
  }

  resetAccountPriorities(): void {
    if (this.accountSelected === 'ALL' || !this.colors.accounts) {
      return;
    }
    this.colors.accounts = _.omit(this.colors.accounts, this.accountSelected.id);
    this.cdr.markForCheck();
  }

  save(_type: 'colors', data: ColorsConfig): void {
    if (!data) {
      return;
    }
    this.settings.colors = JSON.parse(JSON.stringify(data));
    this.messageService.clear();
    this.messageService.add({
      severity: 'success',
      summary: 'Jironimo',
      detail: this.i18n.transform('msgOptionsSaveSuccess')
    });
    this.cdr.markForCheck();
  }
}

/**
 * Workspace refresh interval and worklog timer settings view.
 */
@Component({
  selector: 'jironimo-settings-timer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    Divider,
    InputText,
    ToggleSwitch,
    I18nPipe,
    NavigationComponent
  ],
  templateUrl: '../../views/options-timer.html'
})
export class TimerSettingsComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly settings = new Settings();
  private readonly i18n = new I18nPipe();
  timer: TimerConfig = this.settings.timer;

  save(_type: 'timer', data: TimerConfig): void {
    if (!data) {
      return;
    }
    this.settings.timer = JSON.parse(JSON.stringify(data));
    this.messageService.clear();
    this.messageService.add({
      severity: 'success',
      summary: 'Jironimo',
      detail: this.i18n.transform('msgOptionsSaveSuccess')
    });
    this.cdr.markForCheck();
  }
}

/**
 * Extension version, credits, and license information view.
 */
@Component({
  selector: 'jironimo-settings-about',
  standalone: true,
  imports: [CommonModule, I18nPipe, NavigationComponent],
  templateUrl: '../../views/options-about.html'
})
export class AboutSettingsComponent {}
