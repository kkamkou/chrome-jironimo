import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { Settings } from '../../lib/settings.ts';

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
