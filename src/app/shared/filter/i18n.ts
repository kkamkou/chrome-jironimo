import { Pipe, type PipeTransform } from '@angular/core';

/**
 * Translates localization keys through the Chrome extension i18n API.
 */
@Pipe({ name: 'i18n', standalone: true })
export class I18nPipe implements PipeTransform {
  transform(key: string, substitutions?: Array<string | number>): string {
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      return chrome.i18n.getMessage(
        key,
        substitutions ? substitutions.map(item => String(item)) : undefined
      );
    }
    return key;
  }
}
