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
    const list = this.scope.accountList.map(account => new Promise((resolve, reject) => {
      if (this.scope.accountSelected.id === account.id) {
        account = this.scope.accountSelected;
      }

      if (!account.url || account.url.indexOf('http') !== 0) {
        return reject(new Error(this.i18n('placeholderOptionsAccountUrl')));
      }

      account.url = account.url.replace(/\/+$/, '');
      account.timeout = parseInt(account.timeout, 10) || 10;

      chrome.permissions.request(
        {origins: [account.url + '/']},
        flag => flag ? resolve(account) : reject(new Error(this.i18n('msgGeneralActionConfirm')))
      );
    }));

    Promise
      .all(list)
      .then(accounts => {
        this.settings.accounts = accounts;
        this.settings.general = Object.assign(this.settings.general, {sync: this.scope.sync});

        // activity cleanup
        this.settings.activity = Object.assign(this.settings.activity, {
          workspace: _.omitBy(
            this.settings.activity.workspace,
            (v, k) => !this.settings.accounts.find(a => a.id === k)
          )
        });

        this.scope.notifications
          .push({type: 'success', message: this.i18n('msgOptionsSaveSuccess')})

        this.scope.$digest();
      })
      .catch(e => {
        this.scope.notifications.push({type: 'error', message: e.toString()});
        this.scope.$digest();
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
