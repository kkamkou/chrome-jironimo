'use strict';

class RouteSettingsGeneral extends RouteAbstract {
  constructor($scope) {
    super($scope);
    this.settings = this.services.get('cjSettings');
    this.i18n = this.services.get('$filter')('i18n');

    $scope.accountList = this.settings.accounts;
    $scope.accountSelected = this.settings.accounts[0];
    $scope.sync = this.settings.general.sync;

    $scope.save = this.save.bind(this);
    $scope.accountAdd = this.accountAdd.bind(this);
    $scope.accountRemoveSelected = this.accountRemoveSelected.bind(this);
  }

  save() {
    this.settings.general = Object.assign(this.settings.general, {sync: this.scope.sync});

    const account = this.scope.accountSelected;
    account.url = account.url.replace(/\/+$/, '');
    account.timeout = parseInt(account.timeout, 10) || 10;

    if (!account.url || account.url.indexOf('http') !== 0) {
      this.scope.notifications
        .push({type: 'error', message: this.i18n('placeholderOptionsAccountUrl')});
    }

    chrome.permissions.request({origins: [account.url + '/']}, flag => {
      if (!flag) {
        return false;
      }

      this.settings.accounts = this.scope.accountList
        .map((a, idx) => a.label === account.label ? account : a);

      this.scope.$apply(() =>
        this.scope.notifications
          .push({type: 'success', message: this.i18n('msgOptionsSaveSuccess')})
      );
    });
  }

  accountAdd() {
    const account = Object.assign(this.settings.accounts[0], {url: undefined});

    account.label = prompt(this.i18n('settingsAccountLabelPrompt')) || '';
    if (!account.label.length) {
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
      .filter(a => a.label !== this.scope.accountSelected.label);
    this.scope.accountSelected = _.last(this.scope.accountList);
  }
}
