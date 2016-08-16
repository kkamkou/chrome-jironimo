'use strict';

class RouteSettingsGeneral extends RouteAbstract {
  constructor($scope) {
    super($scope);
    this.settings = this.services.get('cjSettings');
    this.i18n = this.services.get('$filter')('i18n');

    $scope.accountList = this.settings.accounts;
    $scope.accountSelected = this.settings.accounts[0];

    $scope.add = this.add.bind(this);
    $scope.save = this.save.bind(this);
    $scope.sync = this.settings.general.sync;
    $scope.removeSelected = this.removeSelected.bind(this);
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

  add() {
    const num = this.scope.accountList.length + 1,
      account = Object.assign(this.settings.accounts[0], {url: '', label: 'Account #' + num});
    this.scope.accountList.push(account);
    this.scope.accountSelected = account;
  }

  removeSelected() {
    this.scope.accountList.pop(this.scope.accountSelected);
    debugger;
  }
}
