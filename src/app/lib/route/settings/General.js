'use strict';

class RouteSettingsGeneral extends RouteAbstract {
  constructor($scope) {
    super($scope, ['save', 'accountAdd', 'accountRemoveSelected', 'accountAuthVerify']);
    this.settings = this.service('cjSettings');
    this.i18n = this.service('$filter')('i18n');

    $scope.accountList = this.settings.accounts;
    $scope.accountSelected = this.settings.accounts[0];
    $scope.sync = this.settings.general.sync;

    $scope.$watch('accountSelected', () => {
      $scope.accountSelectedAuthStatus = -1;
    });
  }

  save() {
    this.settings.general = Object.assign(this.settings.general, {sync: this.scope.sync});

    const account = this.scope.accountSelected;
    account.url = account.url.replace(/\/+$/, '');
    account.timeout = parseInt(account.timeout, 10) || 10;

    if (!account.url || account.url.indexOf('http') !== 0) {
      this.scope.notifications
        .push({type: 'error', message: this.i18n('placeholderOptionsAccountUrl')});
      return;
    }

    chrome.permissions.request({origins: [account.url + '/']}, flag => {
      if (!flag) { return false; }

      this.settings.accounts = this.scope.accountList.map(a => a.id === account.id ? account : a);

      /*this.settings.activity = _.merge(this.settings.activity, {
        lastWorkspace: _.reject(
          _.get(this.settings.activity, 'lastWorkspace', {}),
          (v, k) => !this.settings.accounts.find(a => a.id === k)
        )
      });*/

      this.scope.$apply(() =>
        this.scope.notifications
          .push({type: 'success', message: this.i18n('msgOptionsSaveSuccess')})
      );
    });
  }

  accountAdd() {
    const account = Object.assign(this.settings.accounts[0], {url: undefined, enabled: true});

    account.label = prompt(this.i18n('settingsAccountLabelPrompt')) || '';
    if (!account.label.length) {
      return false;
    }

    account.id = _.snakeCase(account.label);
    if (~this.scope.accountList.findIndex(a => a.id === account.id)) {
      return false;
    }

    this.scope.accountList.push(account);
    this.scope.accountSelected = account;
  }

  accountRemoveSelected() {
    if (!confirm(this.i18n('msgGeneralActionConfirm'))) {
      return false;
    }

    this.scope.accountList = this.scope.accountList
      .filter(a => a.id !== this.scope.accountSelected.id);

    this.scope.accountSelected = _.last(this.scope.accountList);
  }

  accountAuthVerify(url, timeout) {
    if (!url) { return; }

    this.scope.accountSelectedAuthStatus = 2;

    (new Jira(new Request(this.service('$http')), url, timeout * 1000)).authenticated(
      (err, flag) => this.scope.$apply(() => this.scope.accountSelectedAuthStatus = +flag)
    );
  }
}
