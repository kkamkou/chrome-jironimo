import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, type OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { AccountRoster } from './helpers/account-roster.ts';
import { OriginAccess } from './services/origin-access.ts';

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
  private readonly probe = new JiraProbe(cfg => new FetchTransport().send(cfg));
  private readonly roster = new AccountRoster(this.settings, this.probe);
  private readonly access = new OriginAccess();
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
    if (this.roster.invalid(this.accountList, this.accountSelected)) {
      this.notify('error', this.i18n.transform('placeholderOptionsAccountUrl'));
      return;
    }
    const accounts = this.roster.normalized(this.accountList, this.accountSelected);
    const origins = Array.from(new Set(accounts.map(acc => `${acc.url}/`)));
    this.access
      .request(origins)
      .then(() => {
        this.accountList = accounts;
        this.accountSelected =
          accounts.find(acc => acc.id === this.accountSelected.id) ?? accounts[0];
        this.roster.persist(accounts, this.general);
        this.notify('success', this.i18n.transform('msgOptionsSaveSuccess'));
      })
      .catch(() => {
        this.notify('error', this.i18n.transform('msgGeneralActionConfirm'));
      });
  }

  accountAdd(): boolean {
    const label = prompt(this.i18n.transform('settingsAccountLabelPrompt')) || '';
    const account = this.roster.draft(this.accountList, label);
    if (!account) {
      return false;
    }
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
    this.access
      .request(candidates.map(item => `${item}/`))
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
}
