/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */

function IndexController($q, $rootScope, $scope, cjTimer, cjSettings, cjNotifications, cjJira) {
  var self = this;

  $scope.timer = cjTimer;
  $scope.workspaces = cjSettings.workspaces;

  $scope.issues = [];
  $scope.searchTotal = 0;
  $scope.searchStartAt = 0;
  $scope.searchMaxResults = 25;

  // the active workspace
  $scope.workspaceActive = _.find($scope.workspaces, function (dataSet, index, list) {
    if (_.isNumber(cjSettings.workspaceLast) && list.length >= cjSettings.workspaceLast) {
      return (cjSettings.workspaceLast === index);
    }
    return dataSet.isDefault;
  });

  /**
   * Loads issues for an another workspace
   * @param {Integer} offset
   * @param {Integer} limit
   * @return {void}
   */
  $scope.workspaceRefresh = function (offset, limit) {
    $scope.jiraRequestFailed = false;
    $scope.filterFieldDisplay = false;
    $scope.loading = true;
    $scope.issues = [];

    self._issueSearch($scope.workspaceActive.query, offset, limit)
      .then(
        function (data) {
          $scope.loading = false;
          $scope.searchTotal = data.total;
          $scope.searchStartAt = data.startAt;

          angular.forEach(data.issues, function (issue) {
            $scope.issues.push(self._issueModify(issue));
          });
        },
        function () {
          $scope.loading = false;
        }
      );

    if (cjSettings.timer.workspace > 0) {
      setTimeout(
        $scope.workspaceRefresh,
        parseInt(cjSettings.timer.workspace, 10) * 1000 * 60
      );
    }
  };

  /**
   * Marks another workspace as active
   * @param {Number} index
   */
  $scope.workspaceSwitchTo = function (index) {
    index = $scope.workspaces[index] ? index : 0;

    $scope.workspaceActive = $scope.workspaces[index];
    $scope.workspaceRefresh();

    if (cjSettings.workspaceLast !== index) {
      cjSettings.workspaceLast = index;
    }
  };

  /**
   * Calculates the previous page number
   * @return {Integer}
   */
  $scope.pagePrev = function () {
    var result = $scope.searchStartAt - $scope.searchMaxResults;
    return (result < 0 ? 0 : result);
  };

  /**
   * Calculates the next page number
   * @return {Integer}
   */
  $scope.pageNext = function () {
    var result = $scope.searchStartAt + $scope.searchMaxResults;
    return (result > $scope.searchTotal ? $scope.searchTotal - 1 : result);
  };

  /**
   * Executes transition for the current ticket
   * @param {Object} issue
   * @param {Object} transition
   * @return {void}
   */
  $scope.transition = function (issue, transition) {
    if (!issue) {
      $(event.target).parent().hide();
      return false;
    }

    var dataSet = {
      _method: 'POST',
      transition: {id: transition.id}
    };

    cjJira.transitions(issue.id, dataSet, function (err) {
      if (!err) {
        $scope.workspaceRefresh();
      }
    });
  };

  /**
   * Opens issue in the JIRA
   * @param {Object} index
   * @return {void}
   */
  $scope.tabOpen = function (issue) {
    chrome.tabs.create({
      active: false,
      url: cjSettings.account.url + '/browse/' + issue.key
    });
  };

  /**
   * Opens this extension in a window
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
   * @return {void}
   */
  $scope.issueTimerStart = function (issue) {
    if (issue.fields.assignee) {
      $scope.timer.start(issue);
      return;
    }

    var paramsQuery = {_method: 'PUT', name: cjJira.me().name},
      paramsNotify = {
        title: issue.key,
        message: 'The ticket was assigned to me'
      };

    cjJira.issueAssignee(issue.key, paramsQuery, function (err) {
      if (err) {
        return;
      }

      cjNotifications.createOrUpdate(issue.key, paramsNotify, function () {
        $scope.$apply(function () {
          $scope.timer.start(issue);
        });
      });
    });
  };

  /**
   * Entry set corrections
   * @private
   * @param {Object} issue
   * @return {Object}
   */
  this._issueModify = function (issue) {
    // the closed status
    issue._isClosed = (issue.fields.status.name === 'Closed');
    issue._transitions = [];

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
        issue._transitions = data.transitions;
      }
    });

    return issue;
  };

  /**
   * Loads issues from the API
   * @private
   * @param {String} query
   * @return {Object}
   */
  this._issueSearch = function (query, offset, limit) {
    var deferred = $q.defer(),
      searchData = {
        jql: query,
        startAt: +offset || 0,
        maxResults: +limit || 25
      };

    cjJira.authSession(function (err, flag) {
      if (!flag) {
        return false;
      }
      cjJira.search(searchData, function (err, data) {
        return err ? deferred.reject(err) : deferred.resolve(data);
      });
    });

    return deferred.promise;
  };

  // DOM playground (should be moved somewhere)
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
    $scope.jiraRequestFailed = [S(args[0]).capitalize().s, args[1].join('; ')];
  });
}
