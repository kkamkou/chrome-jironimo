function IndexController($scope, jrApi) {
  var self = this;

  // default workspaces
  $scope.workspaces = jironimoSettings.workspaces;

  // lets find the default workspace
  $scope.workspaceActive = _.find($scope.workspaces, function (dataSet) {
    return dataSet.default;
  });

  $scope.workspaceSwitchTo = function (index) {
    $scope.workspaceActive = $scope.workspaces[index];
    self.workspaceRefresh();
  };

  this.getPriorityColor = function (num) {
    var colorSet = {
      5: {fg: '', bg: ''},
      4: {fg: 'fg-color-white', bg: 'bg-color-darken'},
      3: {fg: 'fg-color-white', bg: 'bg-color-pinkDark'},
      2: {fg: 'fg-color-white', bg: 'bg-color-orangeDark'},
      1: {fg: 'fg-color-white', bg: 'bg-color-red'},
    };
    return colorSet[num];
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
          issue.fields.description = S(issue.fields.description).truncate(70).s;
        }

        issue._colors = self.getPriorityColor(issue.fields.priority.id);

        $scope.issues.push(issue);
      });

      //console.log(data.issues);

      $scope.$apply();
    });

    setTimeout(self.workspaceRefresh, 20000);
  };

  // lets refresh tickets
  jrApi.isAuthenticated(function (err, flag) {
    if (flag) {
      self.workspaceRefresh();
    }
  });
}
