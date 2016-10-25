/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class RouteSettingsWorkspace extends RouteAbstract {
  constructor($scope) {
    super($scope, ['add', 'save', 'remove', 'import', 'accountSwitch', 'isQueryValidForWatch']);

    this.settings = this.service('cjSettings');
    this.i18n = this.service('$filter')('i18n');
    this.jira = this.service('cjJira');

    $scope.accounts = this.settings.accounts.filter(a => a.enabled);
    $scope.accountSelected = '';
    $scope.importingFavorites = false;
    $scope.workspaces = [];

    this.accountSwitch('ALL');
  }

  accountSwitch(label) {
    if (this.scope.accountSelected === label) { return; }

    const filtered = this.settings.workspaces
      .filter(w => w.account === this._accountId(this.scope.accountSelected));

    if (
      (filtered.length !== this.scope.workspaces.length
      || _.differenceWith(this.scope.workspaces, filtered, _.isEqual).length)
      && !confirm('Your changes will be lost if you switch the tab now! Proceed?')
    ) {
      return;
    }

    this.scope.accountSelected = label;
    this.scope.workspaces = this.settings.workspaces
      .filter(w => w.account === this._accountId(label));
  }

  add() {
    if (this.scope.workspaces.length > 10) { return; }

    this.scope.workspaces.push({
      account: this._accountId(this.scope.accountSelected),
      title: null,
      query: null,
      icon: 'bug'
    });
  }

  remove(workspace) {
    if (!confirm(this.i18n('msgGeneralActionConfirm'))) {
      return false;
    }

    if (this.scope.workspaces.length < 2) { return; }

    this.scope.workspaces = this.scope.workspaces.filter(w => w !== workspace);
  }

  import() {
    this.scope.importingFavorites = true;

    this.jira.instance(this.scope.accountSelected).filterFavourite((err, data) => {
      if (err) {
        this.scope.notifications.push({type: 'error', message: err.toString()});
        this.scope.importingFavorites = false;
        this.scope.$digest();
        return;
      }

      var workspaces = _.map(this.scope.workspaces, 'query'),
        favs = _.map(data, 'jql'),
        count = 0;

      _.difference(favs, workspaces).forEach(jql => {
        count++;
        this.scope.workspaces.push({
          account: this._accountId(this.scope.accountSelected),
          icon: 'heart-2',
          query: jql,
          title: _.find(data, {jql: jql}).name
        });
      });

      this.scope.importingFavorites = false;
      this.scope.notifications.push({
        type: 'success',
        message: this.i18n('msgWorkspaceImportSuccess', [count])
      });

      this.scope.$digest();
    });
  }

  isQueryValidForWatch(query) {
    return (/\bupdated(date)?\b/).test(query.toLowerCase());
  }

  save() {
    this.settings.workspaces = this.settings.workspaces
      .filter(w => w.account !== this._accountId(this.scope.accountSelected))
      .concat(this.scope.workspaces);
    this.scope.notifications.push({type: 'success', message: this.i18n('msgOptionsSaveSuccess')});
  }

  /** @access private */
  _accountId(account) {
    return (account === 'ALL' ? 'ALL' : account.id);
  }
}
