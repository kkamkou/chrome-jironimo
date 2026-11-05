import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationComponent } from '../../../shared/directive/navigation.ts';
import { type NotificationEntry, NotifyComponent } from '../../../shared/directive/notify.ts';
import { I18nPipe } from '../../../shared/filter/i18n.ts';
import { Jira } from '../../adapter/jira.ts';
import { FetchTransport } from '../../http/fetch-transport.ts';
import { Request } from '../../http/request.ts';
import { type AccountConfig, type GeneralConfig, Settings } from '../../settings.ts';

/**
 * General settings page managing JIRA server accounts, origin permissions, and sync preferences.
 */
@Component({
  selector: 'jironimo-settings-general',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe, NavigationComponent, NotifyComponent],
  templateUrl: '../../../../views/options-general.html'
})
export class RouteSettingsGeneral {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly settings = new Settings();
  private readonly i18n = new I18nPipe();
  private readonly transport = new FetchTransport();
  notifications: NotificationEntry[] = [];
  accountList: AccountConfig[] = this.settings.accounts;
  accountSelected: AccountConfig = this.accountList[0];
  general: GeneralConfig = this.settings.general;
  accountSelectedAuthStatus = -1;

  constructor() {
    if (!this.accountList.find(acc => acc.enabled)) {
      this.notifications.push({
        type: 'notice',
        message: this.i18n.transform('msgOptionsAccountNoEnabledAccounts')
      });
    }
  }

  onAccountSelect(account: AccountConfig): void {
    this.accountSelected = account;
    this.accountSelectedAuthStatus = -1;
  }

  save(): void {
    const checks = this.accountList.map(
      item =>
        new Promise<AccountConfig>((resolve, reject) => {
          const account = this.accountSelected.id === item.id ? this.accountSelected : item;
          if (!account.url || account.url.indexOf('http') !== 0) {
            reject(new Error(this.i18n.transform('placeholderOptionsAccountUrl')));
            return;
          }
          account.timeout = parseInt(String(account.timeout), 10) || 10;
          this.ensureUrlAllowed(account.url)
            .then(cleanUrl => {
              account.url = cleanUrl;
              resolve(account);
            })
            .catch(() => reject(new Error(this.i18n.transform('msgGeneralActionConfirm'))));
        })
    );
    Promise.all(checks)
      .then(accounts => {
        this.settings.accounts = accounts;
        this.settings.general = { ...this.settings.general, ...this.general };
        const activity = this.settings.activity;
        const workspace = { ...activity.workspace };
        Object.keys(workspace).forEach(key => {
          if (!accounts.find(acc => acc.id === key)) {
            delete workspace[key];
          }
        });
        this.settings.activity = { ...activity, workspace };
        this.notifications.push({
          type: 'success',
          message: this.i18n.transform('msgOptionsSaveSuccess')
        });
        this.cdr.markForCheck();
      })
      .catch(err => {
        this.notifications.push({ type: 'error', message: String(err) });
        this.cdr.markForCheck();
      });
  }

  accountAdd(): boolean {
    const label = prompt(this.i18n.transform('settingsAccountLabelPrompt')) || '';
    if (!label.length) {
      return false;
    }
    const id = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    if (this.accountList.some(acc => acc.id === id)) {
      return false;
    }
    const account: AccountConfig = {
      ...this.settings.accounts[0],
      id,
      label,
      url: null,
      enabled: true
    };
    this.accountList.push(account);
    this.accountSelected = account;
    this.accountSelectedAuthStatus = -1;
    return true;
  }

  accountRemoveSelected(): boolean {
    if (!confirm(this.i18n.transform('msgGeneralActionConfirm'))) {
      return false;
    }
    this.accountList = this.accountList.filter(acc => acc.id !== this.accountSelected.id);
    this.accountSelected = this.accountList[this.accountList.length - 1];
    this.accountSelectedAuthStatus = -1;
    return true;
  }

  accountAuthVerify(url: string | null, timeout: number): void {
    if (!url) {
      return;
    }
    this.accountSelectedAuthStatus = 2;
    this.ensureUrlAllowed(url)
      .then(cleanUrl => {
        new Jira(new Request(cfg => this.transport.send(cfg)), cleanUrl, timeout * 1000).authenticated(
          (_err, flag) => {
            this.accountSelectedAuthStatus = Number(flag);
            this.cdr.markForCheck();
          }
        );
      })
      .catch(() => {
        this.accountSelectedAuthStatus = -1;
        this.cdr.markForCheck();
      });
  }

  private ensureUrlAllowed(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const cleanUrl = url.replace(/\/+$/, '');
      if (typeof chrome === 'undefined' || !chrome.permissions) {
        resolve(cleanUrl);
        return;
      }
      chrome.permissions.request({ origins: [`${cleanUrl}/`] }, flag =>
        flag ? resolve(cleanUrl) : reject()
      );
    });
  }
}
