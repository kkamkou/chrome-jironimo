import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationComponent } from '../../../shared/directive/navigation.ts';
import { I18nPipe } from '../../../shared/filter/i18n.ts';

/**
 * Extension version, credits, and license information view.
 */
@Component({
  selector: 'jironimo-settings-about',
  standalone: true,
  imports: [CommonModule, I18nPipe, NavigationComponent],
  templateUrl: '../../../../views/options-about.html'
})
export class AboutSettingsComponent {}
