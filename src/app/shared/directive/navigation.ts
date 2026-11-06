import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { I18nPipe } from '../filter/i18n.ts';

interface NavEntry {
  icon: string;
  id: string;
  title: string;
}

/**
 * Top-right toolbar navigating between extension settings sections.
 */
@Component({
  selector: 'navigation',
  standalone: true,
  imports: [CommonModule, ButtonDirective, ButtonGroup, I18nPipe],
  host: { style: 'display: contents' },
  templateUrl: '../../../views/macros/options-navigation.html'
})
export class NavigationComponent {
  @Input() current = '';
  private readonly router = inject(Router);
  readonly entries: NavEntry[] = [
    { icon: 'key', id: 'general', title: 'optionsGeneralTitle' },
    { icon: 'bug', id: 'jql', title: 'optionsJqlWorkspacesTitle' },
    { icon: 'sun-3', id: 'colors', title: 'optionsColorsTitle' },
    { icon: 'clock', id: 'timer', title: 'optionsTimerTitle' },
    { icon: 'info-2', id: 'about', title: 'optionsAboutTitle' }
  ];

  goTo(entry: NavEntry): boolean {
    this.router.navigateByUrl(`/settings/${entry.id}`);
    return false;
  }
}
