/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */
function IndexController($q, $rootScope, $scope, cjTimer, cjSettings, cjNotifications, cjJira) {
  // context storing
  var self = this;

  // workspaces
  $scope.workspaces = cjSettings.workspaces;

  // timer
  $scope.timer = cjTimer;

  // the active workspace
  $scope.workspaceActive = _.find($scope.workspaces, function (dataSet, index, list) {
    if (_.isNumber(cjSettings.workspaceLast) && list.length >= cjSettings.workspaceLast) {
      return (cjSettings.workspaceLast === index);
    }
    return dataSet.isDefault;
  });

  /**
   * Loads issues for an another workspace
   *
   * @return {*}
   */
  $scope.workspaceRefresh = function () {
    // reset the failed flag of the api
    $scope.jiraRequestFailed = false;

    // displaying the loader
    $scope.loading = true;

    // removing the filter field
    $scope.filterFieldDisplay = false;

    // issues cleanup
    $scope.issues = [];

    // deffering issues
    self._issueSearch($scope.workspaceActive.query)
      .then(
        function (issues) {
          angular.forEach(issues, function (issue) {
            $scope.issues.push(self._issueModify(issue));
          });
          $scope.loading = false;
        },
        function () {
          $scope.loading = false;
        }
      );

    // refresh interval
    if (cjSettings.timer.workspace > 0) {
      setTimeout(
        $scope.workspaceRefresh,
        parseInt(cjSettings.timer.workspace, 10) * 1000 * 60
      );
    }
  };

  /**
   * Makes another workspace active
   *
   * @param {Number} index
   */
  $scope.workspaceSwitchTo = function (index) {
    // index validation
    index = $scope.workspaces[index] ? index : 0;

    $scope.workspaceActive = $scope.workspaces[index];
    $scope.workspaceRefresh();

    // updating the active workspace
    if (cjSettings.workspaceLast !== index) {
      cjSettings.workspaceLast = index;
    }
  };

  /**
   * Executes transition for the current ticket
   *
   * @param {Object} issue
   * @param {Object} transition
   * @return false
   */
  $scope.transition = function (issue, transition) {
    // we have no transition
    if (!issue) {
      $(event.target).parent().hide();
      return false;
    }

    // the data object
    var dataSet = {
      _method: 'post',
      transition: {id: transition.id}
    };

    // lets update the entry
    cjJira.transitions(issue.id, dataSet, function (err) {
      if (!err) {
        $scope.workspaceRefresh();
      }
    });

    return false;
  };

  /**
   * Opens issue in the JIRA
   *
   * @param {Object} index
   * @return {Boolean}
   */
  $scope.tabOpen = function (issue) {
    chrome.tabs.create({
      active: false,
      url: cjSettings.account.url + '/browse/' + issue.key
    });
    return false;
  };

  /**
   * Opens this extension in a window
   *
   * @return {void}
   */
  $scope.detachWindow = function () {
    var width = 800,
      height = 600,
      cb = function () {
        window.close();
      };

    chrome.windows.create({
      url: 'views/default.html',
      type: 'popup',
      width: width,
      height: height,
      left: Math.round((screen.availWidth - width) / 2),
      top: Math.round((screen.availHeight - height) / 2)
    }, cb);
  };

  /**
   * If an issue is assigned to nobody, we should assign it to us
   *
   * @return {void}
   */
  $scope.issueTimerStart = function (issue) {
    if (issue.fields.assignee) {
      $scope.timer.start(issue);
      return;
    }

    var msg = 'The ticket was assigned to me',
      params = {_method: 'PUT', name: cjJira.me().name};

    cjJira.issueAssignee(issue.key, params, function () {
      cjNotifications.create(issue.key, issue.key, msg, function () {
        $scope.$apply(function () {
          $scope.timer.start(issue);
        });
      });
    });
  };

  /**
   * Entry set corrections
   *
   * @param {Object} issue
   * @return {Object}
   */
  this._issueModify = function (issue) {
    // the closed status
    issue._isClosed = (issue.fields.status.name === 'Closed');

    // timeestimate
    if (issue.fields.timeestimate) {
      issue.fields.timeestimate = moment
        .duration(issue.fields.timeestimate * 1000).humanize();
    }

    // applying custom sizes
    issue._size = cjSettings.colors
      .sizes[issue.fields.issuetype.name.toLowerCase()] || cjSettings.colors
      .sizes.task;

    // applying custom colors
    issue._colors = cjSettings.colors.priority[issue.fields.priority.id]
      ? cjSettings.colors.priority[issue.fields.priority.id]
      : cjSettings.colors.priority[0];

    // lets load some transitions
    cjJira.transitions(issue.id, {}, function (err, data) {
      if (!err && data.transitions) {
        $scope.$apply(function () {
          issue._transitions = data.transitions;
        });
      }
    });

    return issue;
  };

  /**
   * Loads issues from the API
   *
   * @param {String} query
   * @private
   * @return {Object}
   */
  this._issueSearch = function (query) {
    // defaults
    var deferred = $q.defer();

    // auth check
    cjJira.authSession(function (err, flag) {
      // user is not authorized
      if (!flag) {
        return false;
      }

      // content update after
      cjJira.search(query, function (err, data) {
        $scope.$apply(function () {
          return err ? deferred.reject(err) : deferred.resolve(data.issues);
        });
      });
    });

    return deferred.promise;
  };

  // DOM playground(should be moved somewhere)
  $scope.$on('$viewContentLoaded', function () {
    var $tiles = $('div.tiles');

    $tiles.on('click', 'div.tile', function () {
      $tiles.find('div.toolbar:visible').slideUp('fast');
      $(this).find('div.toolbar:not(:visible)').slideDown('fast');
      return false;
    });

    $tiles.on('click', 'button.transitions', function () {
      $(this).closest('div.tile').find('div.transitions').show();
      return false;
    });

    $scope.workspaceRefresh();
  });

  $scope.$watch('filterFieldDisplay', function (value) {
    if (!value) {
      return false;
    }
    setTimeout(function () {
      $('#filter input').focus();
    }, 100);
  });

  $rootScope.$on('jiraRequestFail', function (event, args) {
    $scope.$apply(function () {
      $scope.jiraRequestFailed = [S(args[0]).capitalize().s, args[1].join('; ')];
    });
  });
}
