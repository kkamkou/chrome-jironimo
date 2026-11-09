import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, type OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import _ from 'lodash';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { Dialog } from 'primeng/dialog';
import { Divider } from 'primeng/divider';
import { InputGroup } from 'primeng/inputgroup';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { NavigationComponent } from '../../../shared/directive/navigation.ts';
import { I18nPipe } from '../../../shared/filter/i18n.ts';
import { FetchTransport } from '../../http/fetch-transport.ts';
import { JiraProbe, type ProbeAttempt, type ProbeOutcome } from '../../jira-api.ts';
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
    Dialog,
    Divider,
    InputGroup,
    InputText,
    Select,
    Tag,
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
  private readonly probe = new JiraProbe(cfg => this.transport.send(cfg));
  accountList: AccountConfig[] = this.settings.accounts;
  accountSelected: AccountConfig = this.accountList[0];
  general: GeneralConfig = this.settings.general;
  accountSelectedAuthStatus = -1;
  probeDialogVisible = false;
  probing = false;
  probeAttempts: ProbeAttempt[] = [];
  probeOutcome: ProbeOutcome | null = null;

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
      account.url = this.probe.normalize(account.url!);
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
    const trimmed = String(url ?? '').trim();
    if (!trimmed || trimmed.indexOf('http') !== 0) {
      this.probeAttempts = [];
      this.probeOutcome = { matchedUrl: null, version: null, authenticated: false, attempts: [] };
      this.probing = false;
      this.probeDialogVisible = true;
      this.cdr.markForCheck();
      return;
    }
    const candidates = this.probe.candidates(trimmed);
    this.accountSelectedAuthStatus = 2;
    this.probeAttempts = [];
    this.probeOutcome = null;
    this.probing = true;
    this.probeDialogVisible = true;
    this.cdr.markForCheck();
    this.ensureOriginsAllowed(candidates.map(item => `${item}/`))
      .then(() =>
        this.probe.run(trimmed, (Number(timeout) || 10) * 1000, attempts => {
          this.probeAttempts = attempts;
          this.cdr.markForCheck();
        })
      )
      .then(outcome => {
        this.probing = false;
        this.probeOutcome = outcome;
        this.probeAttempts = outcome.attempts;
        if (outcome.matchedUrl) {
          this.accountSelected.url = outcome.matchedUrl;
        }
        this.accountSelectedAuthStatus = outcome.matchedUrl && outcome.authenticated ? 1 : 0;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.probing = false;
        this.probeDialogVisible = false;
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
