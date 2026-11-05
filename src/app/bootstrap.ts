import './exception.ts';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterOutlet, type Routes, provideRouter, withHashLocation } from '@angular/router';
import { IndexComponent } from './controllers/index.ts';
import {
  AboutSettingsComponent,
  ColorsSettingsComponent,
  TimerSettingsComponent
} from './controllers/settings.ts';
import { RouteSettingsGeneral } from './lib/route/settings/General.ts';
import { RouteSettingsWorkspace } from './lib/route/settings/Workspace.ts';
import { Settings } from './lib/settings.ts';

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
  imports: [RouterOutlet],
  host: { style: 'display: contents' },
  template: '<router-outlet></router-outlet>'
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
  providers: [provideZonelessChangeDetection(), provideRouter(routes, withHashLocation())]
});
