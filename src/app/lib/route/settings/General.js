/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class RouteSettingsGeneral extends RouteAbstract {
  constructor($scope) {
    super($scope, ['save', 'accountAdd', 'accountRemoveSelected', 'accountAuthVerify']);
    this.settings = this.service('cjSettings');
    this.i18n = this.service('$filter')('i18n');

    $scope.accountList = this.settings.accounts;
    $scope.accountSelected = this.settings.accounts[0];
    $scope.general = this.settings.general;

    $scope.$watch('accountSelected', () => {
      $scope.accountSelectedAuthStatus = -1;
    });

    if (!$scope.accountList.find(a => a.enabled)) {
      this.scope.notifications.push(
        {type: 'notice', message: this.i18n('msgOptionsAccountNoEnabledAccounts')}
      );
    }
  }

  save() {
    const list = this.scope.accountList.map(account => new Promise((resolve, reject) => {
      if (this.scope.accountSelected.id === account.id) {
        account = this.scope.accountSelected;
      }

      if (!account.url || account.url.indexOf('http') !== 0) {
        return reject(new Error(this.i18n('placeholderOptionsAccountUrl')));
      }

      account.timeout = parseInt(account.timeout, 10) || 10;

      this._ensureUrlIsAllowed(account.url)
        .then(url => {
          account.url = url;
          resolve(account);
        })
        .catch(() => reject(new Error(this.i18n('msgGeneralActionConfirm'))));
    }));

    Promise
      .all(list)
      .then(accounts => {
        this.settings.accounts = accounts;
        this.settings.general = Object.assign(this.settings.general, this.scope.general);

        // activity cleanup
        this.settings.activity = Object.assign(this.settings.activity, {
          workspace: _.omitBy(
            this.settings.activity.workspace,
            (v, k) => !this.settings.accounts.find(a => a.id === k)
          )
        });

        this.scope.notifications
          .push({type: 'success', message: this.i18n('msgOptionsSaveSuccess')});

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

    this._ensureUrlIsAllowed(url)
      .then(cleanUrl => {
        (new Jira(new Request(this.service('$http')), cleanUrl, timeout * 1000)).authenticated(
          (err, flag) => this.scope.$apply(() => this.scope.accountSelectedAuthStatus = +flag)
        );
      })
      .catch(() => {
        this.scope.accountSelectedAuthStatus = -1;
        this.scope.$digest();
      });
  }

  _ensureUrlIsAllowed(url) {
    return new Promise((resolve, reject) => {
      const cleanUrl = url.replace(/\/+$/, '');
      chrome.permissions
        .request({origins: [cleanUrl + '/']}, flag => flag ? resolve(cleanUrl) : reject());
    });
  }
}
