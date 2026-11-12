import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { type Routes, provideRouter, withHashLocation } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { IndexComponent } from './controllers/index.ts';
import {
  AboutSettingsComponent,
  ColorsSettingsComponent,
  TimerSettingsComponent
} from './controllers/settings.ts';
import { RouteSettingsGeneral } from './lib/route/settings/General.ts';
import { RouteSettingsWorkspace } from './lib/route/settings/Workspace.ts';
import { AppComponent } from './shared/components/app.ts';
import { MetroPreset } from './shared/helpers/metro-preset.ts';

export { AppComponent } from './shared/components/app.ts';

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'settings/general', component: RouteSettingsGeneral },
  { path: 'settings/colors', component: ColorsSettingsComponent },
  { path: 'settings/jql', component: RouteSettingsWorkspace },
  { path: 'settings/timer', component: TimerSettingsComponent },
  { path: 'settings/about', component: AboutSettingsComponent },
  { path: '**', redirectTo: '' }
];

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
