'use strict';

class RouteSettingsWorkspace extends RouteAbstract {
  constructor($scope) {
    super(
      $scope,
      ['add', 'save', 'remove', 'import', 'setAsDefault', 'accountSwitch', 'queryIsValidForWatch']
    );

    this.settings = this.service('cjSettings');
    this.i18n = this.service('$filter')('i18n');
    this.jira = this.service('cjJira');

    $scope.accounts = this.settings.accounts;
    $scope.accountSelected = '';
    $scope.workspaces = [];

    this.accountSwitch('ALL');
  }

  accountSwitch(label) {
    if (this.scope.accountSelected === label) { return; }

    const filtered = this.settings.workspaces
      .filter(w => w.account === this.accountLabel(this.scope.accountSelected));

    if (
      (filtered.length !== this.scope.workspaces.length
      || _.differenceWith(this.scope.workspaces, filtered, _.isEqual).length)
      && !confirm('Your changes will be lost if you switch the tab now! Proceed?')
    ) {
      return;
    }

    this.scope.accountSelected = label;
    this.scope.workspaces = this.settings.workspaces
      .filter(w => w.account === this.accountLabel(label));
  }

  accountLabel(account) {
    return (account === 'ALL' ? 'ALL' : account.label);
  }

  add() {
    if (this.scope.workspaces.length > 10) { return; }

    this.scope.workspaces.push({
      account: this.accountLabel(this.scope.accountSelected),
      title: null,
      query: null,
      isDefault: false,
      icon: 'bug'
    });
  }

  setAsDefault(workspace) {
    this.scope.workspaces.forEach(w => w.isDefault = (w === workspace));
  }

  remove(workspace) {
    if (!confirm(this.i18n('msgGeneralActionConfirm'))) {
      return false;
    }

    if (this.scope.workspaces.length < 2) { return; }

    this.scope.workspaces = this.scope.workspaces.filter(w => w !== workspace);

    if (workspace.isDefault) {
      this.setAsDefault(this.scope.workspaces[0]);
    }
  }

  import() {
    this.jira.filterFavourite((err, data) => {
      if (err) {
        this.scope.notifications.push({type: 'error', message: err.message});
        return;
      }

      var workspaces = _.map(this.scope.workspaces, 'query'),
        favs = _.map(data, 'jql'),
        count = 0;

      _.difference(favs, workspaces).forEach(jql => {
        count++;
        this.scope.workspaces.push({
          isDefault: false,
          title: _.find(data, {jql: jql}).name,
          query: jql,
          icon: 'heart-2'
        });
      });

      this.scope.notifications.push({
        type: 'success',
        message: this.i18n('msgWorkspaceImportSuccess', [count])
      });
    });
  }

  queryIsValidForWatch(query) {
    return (/\bupdated(date)?\b/).test(query.toLowerCase());
  }

  save() {
    this.settings.workspaces = this.settings.workspaces
      .filter(w => w.account !== this.accountLabel(this.scope.accountSelected))
      .concat(this.scope.workspaces);
    this.scope.notifications.push({
      type: 'success',
      message: this.i18n('msgWorkspaceImportSuccess', [1])
    });
  }
}
