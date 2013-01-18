function IndexController($scope, jrApi) {
  // context storing
  var self = this;

  // workspaces
  $scope.workspaces = jironimoSettings.workspaces;

  // the default workspace
  $scope.workspaceActive = _.find($scope.workspaces, function (dataSet) {
    return dataSet.default;
  });

  /**
   * Makes another workspace active
   *
   * @param {Number} index
   */
  $scope.workspaceSwitchTo = function (index) {
    if (!$scope.workspaces[index]) {
      index = 0;
    }
    $scope.workspaceActive = $scope.workspaces[index];
    self.workspaceRefresh();
  };

  $scope.tabOpen = function (index) {
    chrome.tabs.create({
      url: jironimoSettings.account.url + '/browse/' + $scope.issues[index].key,
      active: false
    });
    return false;
  };

  this.workspaceRefresh = function () {
    $scope.issues = [];

    jrApi.search($scope.workspaceActive.query, function (err, data) {
      if (err) {
        return false;
      }

      // some corrections
      $.map(data.issues, function (issue) {
        if (issue.fields.description) {
          issue.fields.description = S(issue.fields.description).truncate(100).s;
        }

        issue._isClosed = (issue.fields.status.name === 'Closed');

        // applying custom colors
        issue._colors = jironimoSettings.colors.priority[issue.fields.priority.id]
          ? jironimoSettings.colors.priority[issue.fields.priority.id]
          : jironimoSettings.colors.priority[0];

        $scope.issues.push(issue);
      });

      console.log(data.issues);

      $scope.$apply();
    });

    // refresh interval
    setTimeout(
      self.workspaceRefresh,
      parseInt(jironimoSettings.timer.workspace, 10) * 1000 * 60
    );
  };

  // lets refresh tickets
  jrApi.isAuthenticated(function (err, flag) {
    if (flag) {
      self.workspaceRefresh();
    }
  });

  $(function () {
    $(window).bind('mousewheel', function(event, delta) {
      console.log(delta)
      if (delta > 0) { window.scrollBy(-80,0);
      } else window.scrollBy(80,20) ;
  });
  });

}
