import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Settings, type TimerConfig } from '../../../lib/settings.ts';
import { NavigationComponent } from '../../../shared/directive/navigation.ts';
import { I18nPipe } from '../../../shared/filter/i18n.ts';

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
  templateUrl: '../../../../views/options-timer.html'
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
