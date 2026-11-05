import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type ColorsConfig, Settings, type TimerConfig } from '../lib/settings.ts';
import { NavigationComponent } from '../shared/directive/navigation.ts';
import { type NotificationEntry, NotifyComponent } from '../shared/directive/notify.ts';
import { I18nPipe } from '../shared/filter/i18n.ts';

/**
 * Colors and tile sizing settings view.
 */
@Component({
  selector: 'jironimo-settings-colors',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe, NavigationComponent, NotifyComponent],
  templateUrl: '../../views/options-colors.html'
})
export class ColorsSettingsComponent {
  private readonly settings = new Settings();
  private readonly i18n = new I18nPipe();
  colors: ColorsConfig = this.settings.colors;
  tabControl = { colors: 'theme' };
  notifications: NotificationEntry[] = [];
  readonly colorFrames = [
    { key: 'theme', title: 'settingsColorsDefaultTheme' },
    { key: 'colors', title: 'settingsColorsPriorityColors' },
    { key: 'sizes', title: 'settingsColorsPrioritySizes' }
  ];
  readonly priorityKeys = Object.keys(this.colors.priority).map(key => Number(key));
  readonly sizeKeys = Object.keys(this.colors.sizes);

  save(_type: 'colors', data: ColorsConfig): void {
    if (!data) {
      return;
    }
    this.settings.colors = JSON.parse(JSON.stringify(data));
    this.notifications.push({
      type: 'success',
      message: this.i18n.transform('msgOptionsSaveSuccess')
    });
  }
}

/**
 * Workspace refresh interval and worklog timer settings view.
 */
@Component({
  selector: 'jironimo-settings-timer',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe, NavigationComponent, NotifyComponent],
  templateUrl: '../../views/options-timer.html'
})
export class TimerSettingsComponent {
  private readonly settings = new Settings();
  private readonly i18n = new I18nPipe();
  timer: TimerConfig = this.settings.timer;
  notifications: NotificationEntry[] = [];

  save(_type: 'timer', data: TimerConfig): void {
    if (!data) {
      return;
    }
    this.settings.timer = JSON.parse(JSON.stringify(data));
    this.notifications.push({
      type: 'success',
      message: this.i18n.transform('msgOptionsSaveSuccess')
    });
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
