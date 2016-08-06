'use strict';

class RouteSettingsGeneral extends RouteAbstract {
  constructor($scope, $settings) {
    super($scope, $settings);
    $scope.accounts = $settings.accounts;
    $scope.account = this.account;
    $scope.save = this.save.bind(this);
    $scope.sync = $settings.general.sync;
  }

  get account() {
    const account = this.settings.accounts.find(a => a.isDefault === true);
    return account ? account : this.settings.accounts[0];
  }

  save() {
    const account = this.scope.account;
    account.url = account.url.replace(/\/+$/, '');
    account.timeout = parseInt(account.timeout, 10) || 10;
    chrome.permissions.request({origins: [account.url + '/']}, flag => {
      if (!flag) { return false; }
      cjSettings[type] = angular.copy(data);
      $this.scope.notifications.push(
        {type: 'success', message: $filter('i18n')('msgOptionsSaveSuccess')}
      );
    });
  }
}
