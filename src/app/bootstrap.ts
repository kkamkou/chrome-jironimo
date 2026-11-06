import { Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterOutlet, type Routes, provideRouter, withHashLocation } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Nora from '@primeuix/themes/nora';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { Toast } from 'primeng/toast';
import { IndexComponent } from './controllers/index.ts';
import {
  AboutSettingsComponent,
  ColorsSettingsComponent,
  TimerSettingsComponent
} from './controllers/settings.ts';
import { RouteSettingsGeneral } from './lib/route/settings/General.ts';
import { RouteSettingsWorkspace } from './lib/route/settings/Workspace.ts';
import { Settings } from './lib/settings.ts';

const MetroPreset = definePreset(Nora, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '0',
      sm: '0',
      md: '0',
      lg: '0',
      xl: '0'
    }
  },
  semantic: {
    primary: {
      50: '#e6f7f7',
      100: '#b3e6e7',
      200: '#80d6d7',
      300: '#4dc5c7',
      400: '#26b8ba',
      500: '#00aba9',
      600: '#008287',
      700: '#006b6f',
      800: '#005457',
      900: '#004050',
      950: '#002a35'
    }
  },
  components: {
    toggleswitch: {
      root: {
        width: '2.75rem',
        height: '1.25rem',
        borderRadius: '0',
        gap: '0.125rem',
        borderWidth: '1px',
        background: '#a6a6a6',
        hoverBackground: '#969696',
        checkedBackground: '#008287',
        checkedHoverBackground: '#00aba9'
      },
      handle: {
        borderRadius: '0',
        size: '0.875rem',
        background: '#ffffff',
        hoverBackground: '#f5f5f5',
        checkedBackground: '#ffffff',
        checkedHoverBackground: '#ffffff'
      }
    }
  }
});

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'settings/general', component: RouteSettingsGeneral },
  { path: 'settings/colors', component: ColorsSettingsComponent },
  { path: 'settings/jql', component: RouteSettingsWorkspace },
  { path: 'settings/timer', component: TimerSettingsComponent },
  { path: 'settings/about', component: AboutSettingsComponent },
  { path: '**', redirectTo: '' }
];

/**
 * Root shell component hosting the extension router outlet and synchronizing Chrome storage on startup.
 */
@Component({
  selector: 'jironimo-root',
  standalone: true,
  imports: [RouterOutlet, Toast],
  host: { style: 'display: contents' },
  template: '<p-toast position="bottom-right" /><router-outlet></router-outlet>'
})
export class AppComponent {
  constructor() {
    const settings = new Settings();
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local?.get(settings.getStorageData(), localItems => {
        settings.setStorageData(localItems as Record<string, string>);
        chrome.storage.local?.set(settings.getStorageData());
      });
      if (settings.general.sync && chrome.storage.sync) {
        chrome.storage.sync.get(settings.getStorageData(), items => {
          settings.setStorageData(items as Record<string, string>);
          chrome.storage.local?.set(settings.getStorageData());
        });
      }
    }
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    MessageService,
    providePrimeNG({
      theme: {
        preset: MetroPreset,
        options: { darkModeSelector: false }
      }
    })
  ]
});
