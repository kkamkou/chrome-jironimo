function IndexController($scope, cjTimer, cjSettings, cjJira) {
  // context storing
  var self = this;

  // the loading state
  $scope.loading = true;

  // workspaces
  $scope.workspaces = cjSettings.workspaces;

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
      active: false,
      url: cjSettings.account.url +
        '/browse/' + $scope.issues[index].key
    });
    return false;
  };

  $scope.timer = cjTimer;

  this.workspaceRefresh = function () {
    $scope.issues = [];
    $scope.loading = true;

    cjJira.search($scope.workspaceActive.query, function (err, data) {
      if (err) {
        $scope.loading = false;
        return false;
      }

      // some corrections
      $.map(data.issues, function (issue) {
        // no description
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
        issue._colors = cjSettings.colors.priority[issue.fields.priority.id]
          ? cjSettings.colors.priority[issue.fields.priority.id]
          : cjSettings.colors.priority[0];

        // can we start the timer?
        //issue._timerAlowed = !issue._isClosed && !cjTimer.isStarted(issue);

        $scope.issues.push(issue);
      });

      //console.log(data.issues);

      $scope.loading = false;
      $scope.$apply();

    });

    // refresh interval
    setTimeout(
      self.workspaceRefresh,
      parseInt(cjSettings.timer.workspace, 10) * 1000 * 60
    );
  };

  // lets refresh tickets
  cjJira.isAuthenticated(function (err, flag) {
    if (flag) {
      self.workspaceRefresh();
    }
  });

  $(function () {
    var $tiles = $('div.tiles');

    $tiles.on('click', 'div.tile', function () {
      $tiles.find('div.toolbar:visible').slideUp('fast');
      $(this).find('div.toolbar:not(:visible)').slideDown('fast');
      return false;
    });
  });
}
