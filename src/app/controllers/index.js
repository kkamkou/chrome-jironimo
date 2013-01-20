function IndexController($scope, jrApi) {
  // context storing
  var self = this;

  // the loading state
  $scope.loading = true;

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
    $scope.loading = true;

    jrApi.search($scope.workspaceActive.query, function (err, data) {
      if (err) {
        $scope.loading = false;
        return false;
      }

      // some corrections
      $.map(data.issues, function (issue) {
        if (!issue.fields.description) {
          issue.fields.description = 'Without description';
        }

        // the description length
        issue._description = S(issue.fields.description)
          .truncate(100).s;

        // the closed status
        issue._isClosed = (issue.fields.status.name === 'Closed');

        // timeestimate
        if (issue.fields.timeestimate) {
          issue.fields.timeestimate = moment
            .humanizeDuration(issue.fields.timeestimate * 1000);
        }

        // applying custom colors
        issue._colors = jironimoSettings.colors.priority[issue.fields.priority.id]
          ? jironimoSettings.colors.priority[issue.fields.priority.id]
          : jironimoSettings.colors.priority[0];

        // can we start the timer?
        issue._timerAlowed = !issue._isClosed;

        $scope.issues.push(issue);
      });

      console.log(data.issues);

      $scope.loading = false;
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
    var $tiles = $('div.tiles');

    $tiles.on('click', 'div.tile', function (e) {
      $tiles.find('div.toolbar:visible').slideUp('fast');
      $(this).find('div.toolbar:not(:visible)').slideDown('fast');
      return false;
    });
  });
}
