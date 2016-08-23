'use strict';

class RouteSettingsWorkspace extends RouteAbstract {
  constructor($scope) {
    super($scope);
    this.settings = this.services.get('cjSettings');
    this.i18n = this.services.get('$filter')('i18n');
    this.jira = this.services.get('cjJira');

    $scope.accounts = this.settings.accounts;

    $scope.add = this.add.bind(this);
    $scope.save = this.save.bind(this);
    $scope.remove = this.remove.bind(this);
    $scope.import = this.import.bind(this);
    $scope.setAsDefault = this.setAsDefault.bind(this);
    $scope.accountSwitch = this.accountSwitch.bind(this);
    $scope.queryIsValidForWatch = this.queryIsValidForWatch.bind(this);

    this.accountSwitch('ALL');
  }

  accountSwitch(account) {
    this.scope.accountSelected = account;
    this.scope.workspaces = this.settings.workspaces
      .filter(w => w.account === this.accountLabel(account));
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

  save(a) {
    this.scope.accountSelected = a;
    console.log(a);
  }
}
