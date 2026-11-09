import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, type OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import _ from 'lodash';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { Divider } from 'primeng/divider';
import { InputGroup } from 'primeng/inputgroup';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { NavigationComponent } from '../../../shared/directive/navigation.ts';
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
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    ButtonGroup,
    Divider,
    InputGroup,
    InputText,
    Select,
    ToggleSwitch,
    I18nPipe,
    NavigationComponent
  ],
  templateUrl: '../../../../views/options-general.html'
})
export class RouteSettingsGeneral implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly settings = new Settings();
  private readonly i18n = new I18nPipe();
  private readonly transport = new FetchTransport();
  accountList: AccountConfig[] = this.settings.accounts;
  accountSelected: AccountConfig = this.accountList[0];
  general: GeneralConfig = this.settings.general;
  accountSelectedAuthStatus = -1;

  ngOnInit(): void {
    if (!this.accountList.find(acc => acc.enabled)) {
      this.notify('warn', this.i18n.transform('msgOptionsAccountNoEnabledAccounts'));
    }
  }

  onAccountSelect(account: AccountConfig): void {
    this.accountSelected = account;
    this.accountSelectedAuthStatus = -1;
  }

  save(): void {
    const invalidAccount = this.accountList.find(item => {
      const account = this.accountSelected.id === item.id ? this.accountSelected : item;
      return !account.url || account.url.indexOf('http') !== 0;
    });
    if (invalidAccount) {
      this.notify('error', this.i18n.transform('placeholderOptionsAccountUrl'));
      return;
    }
    const accounts = this.accountList.map(item => {
      const account = { ...(this.accountSelected.id === item.id ? this.accountSelected : item) };
      account.url = account.url!.replace(/\/+$/, '');
      account.timeout = parseInt(String(account.timeout), 10) || 10;
      return account;
    });
    const origins = Array.from(new Set(accounts.map(acc => `${acc.url}/`)));
    this.ensureOriginsAllowed(origins)
      .then(() => {
        this.accountList = accounts;
        this.accountSelected =
          accounts.find(acc => acc.id === this.accountSelected.id) ?? accounts[0];
        this.settings.accounts = accounts;
        this.settings.general = { ...this.settings.general, ...this.general };
        const ids = accounts.map(acc => acc.id);
        this.settings.activity = {
          ...this.settings.activity,
          workspace: _.pick(this.settings.activity.workspace, ids)
        };
        if (this.settings.colors.accounts) {
          this.settings.colors = {
            ...this.settings.colors,
            accounts: _.pick(this.settings.colors.accounts, ids)
          };
        }
        this.notify('success', this.i18n.transform('msgOptionsSaveSuccess'));
      })
      .catch(() => {
        this.notify('error', this.i18n.transform('msgGeneralActionConfirm'));
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
    this.accountList = [...this.accountList, account];
    this.accountSelected = account;
    this.accountSelectedAuthStatus = -1;
    this.cdr.markForCheck();
    return true;
  }

  accountRemoveSelected(): boolean {
    if (!confirm(this.i18n.transform('msgGeneralActionConfirm'))) {
      return false;
    }
    this.accountList = this.accountList.filter(acc => acc.id !== this.accountSelected.id);
    this.accountSelected = this.accountList[this.accountList.length - 1];
    this.accountSelectedAuthStatus = -1;
    this.cdr.markForCheck();
    return true;
  }

  accountAuthVerify(url: string | null, timeout: number): void {
    if (!url) {
      return;
    }
    const cleanUrl = url.replace(/\/+$/, '');
    this.accountSelectedAuthStatus = 2;
    this.ensureOriginsAllowed([`${cleanUrl}/`])
      .then(() => {
        new Jira(
          new Request(cfg => this.transport.send(cfg)),
          cleanUrl,
          timeout * 1000
        ).authenticated((_err, flag) => {
          this.accountSelectedAuthStatus = Number(flag);
          this.cdr.markForCheck();
        });
      })
      .catch(() => {
        this.accountSelectedAuthStatus = -1;
        this.cdr.markForCheck();
      });
  }

  private notify(severity: 'success' | 'error' | 'warn' | 'info', detail: string): void {
    this.messageService.clear();
    this.messageService.add({ severity, summary: 'Jironimo', detail });
  }

  private ensureOriginsAllowed(origins: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.permissions) {
        resolve();
        return;
      }
      chrome.permissions.request({ origins }, flag => (flag ? resolve() : reject()));
    });
  }
}
