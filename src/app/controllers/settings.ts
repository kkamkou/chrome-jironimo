import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { type ColorsConfig, Settings, type TimerConfig } from '../lib/settings.ts';
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
    InputText,
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
  colors: ColorsConfig = this.settings.colors;
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
  readonly priorityKeys = Object.keys(this.colors.priority).map(key => Number(key));
  readonly sizeKeys = Object.keys(this.colors.sizes);

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
