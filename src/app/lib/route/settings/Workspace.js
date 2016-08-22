'use strict';

class RouteSettingsWorkspace extends RouteAbstract {
  constructor($scope) {
    super($scope);
    this.settings = this.services.get('cjSettings');
    this.i18n = this.services.get('$filter')('i18n');

    $scope.workspaces = this.settings.workspaces;

    $scope.save = this.save.bind(this);
  }

  add() {
    if (this.scope.workspaces.length > 10) { return; }

    this.scope.workspaces.push(
      {title: null, query: null, isDefault: false, icon: 'bug'}
    );
  }

  setAsDefault(workspace) {
    this.scope.workspaces.forEach(entry => entry.isDefault = (entry === workspace));
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
    cjJira.filterFavourite((err, data) => {
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
  }
}
