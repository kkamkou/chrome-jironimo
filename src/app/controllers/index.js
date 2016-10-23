/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

'use strict';

angular
  .module('jironimo')
  .controller('IndexController', [
    '$q', '$timeout', '$rootScope', '$scope', 'cjSettings', 'cjJira', 'cjTimer',
    function ($q, $timeout, $rootScope, $scope, cjSettings, cjJira, cjTimer) {
      var api = null,
        self = this,
        timeouts = {workspaceRefresh: null};

      $scope.accounts = cjSettings.accounts.filter(a => a.enabled);
      $scope.issueFocused = null;
      $scope.issues = [];
      $scope.loading = false;
      $scope.searchMaxResults = 16;
      $scope.searchStartAt = 0;
      $scope.searchTotal = 0;
      $scope.windowDetached = false;
      $scope.workspaceActive = cjSettings.workspaces[0];
      $scope.workspaces = cjSettings.workspaces;

      $scope.$watch('account', account => {
        const activity = _.get(cjSettings.activity, 'lastAccount'),
          idx = _.findIndex($scope.accounts, account);

        if (activity !== idx) {
          cjSettings.activity = _.set(cjSettings.activity, 'lastAccount', idx);
        }

        $scope.workspaces = _workspaceListByAccount(account);
        $scope.workspaceActive = _workspaceActiveByAccount(account);
        $scope.searchMaxResults = _workspaceSearchMaxResults(account);
        $scope.api = cjJira.instance(account);
        $scope.timer = cjTimer.instance(account, $scope.api);

        $scope.searchReset().workspaceRefresh();
      });

      $scope.account = $scope.accounts[_.get(cjSettings.activity, 'lastAccount', 0)]
        || $scope.accounts[0];

      /** @access private */
      function _workspaceSearchMaxResults(account) {
        return _.get(
          cjSettings.activity, `lastWorkspace.${account.id}.searchMaxResults`, 16
        );
      }

      /** @access private */
      function _workspaceListByAccount(account) {
        return cjSettings.workspaces.filter(a => ~['ALL', account.id].indexOf(a.account));
      }

      /** @access private */
      function _workspaceActiveByAccount(account) {
        const activity = _.get(cjSettings.activity, `lastWorkspace.${account.id}.index`, 0);
        return $scope.workspaces[($scope.workspaces.length - 1 >= activity) ? activity : 0];
      }

      // init
      $scope.$on('$routeChangeSuccess', function () {
        if (!cjSettings.accounts.find(a => a.enabled)) {
          $scope.tabSettings();
          return;
        }
        chrome.windows.getCurrent(null, function (win) {
          $scope.windowDetached = (win.type === 'popup');
        });
      });

      /**
       * Loads issues for an another workspace
       * @param [Integer] offset
       * @param [Integer] limit
       * @return {void}
       */
      $scope.workspaceRefresh = function (offset, limit) {
        $scope.loading = true;
        $scope.issues = [];

        if (_.isUndefined(offset)) {
          offset = $scope.searchStartAt;
        }

        if (_.isUndefined(limit)) {
          limit = $scope.searchMaxResults;
        }

        self
          ._issueSearch($scope.workspaceActive.query, +offset, +limit)
          .then(data => {
            $scope.loading = false;
            $scope.searchTotal = data.total;
            $scope.searchStartAt = data.startAt;
            (data.issues || []).forEach(issue => $scope.issues.push(self._issueModify(issue)));
          })
          .catch(() => $scope.loading = false);

        const searchMaxResultsKey = `lastWorkspace.${$scope.account.id}.searchMaxResults`;
        if (_.get(cjSettings.activity, searchMaxResultsKey) !== limit) {
          cjSettings.activity = _.set(cjSettings.activity, searchMaxResultsKey, limit);
        }

        if (cjSettings.timer.workspace > 0) {
          $timeout.cancel(timeouts.workspaceRefresh);
          timeouts.workspaceRefresh = $timeout(
            () => $scope.workspaceRefresh(offset, limit),
            parseInt(cjSettings.timer.workspace, 10) * 1000 * 60,
            false
          );
        }
      };

      /**
       * Marks another workspace as active
       * @param {Number} idx
       */
      $scope.workspaceSwitchTo = function (idx) {
        idx = $scope.workspaces[idx] ? idx : 0;

        $scope.workspaceActive = $scope.workspaces[idx];
        $scope.searchReset().workspaceRefresh();

        const activity = _.get(cjSettings.activity, `lastWorkspace.${$scope.account.id}.index`);
        if (activity !== idx) {
          cjSettings.activity = _.set(
            cjSettings.activity, `lastWorkspace.${$scope.account.id}.index`, idx
          );
        }
      };

      /**
       * Resets the pagination data
       * @return {$scope}
       */
      $scope.searchReset = function () {
        $scope.searchTotal = 0;
        $scope.searchStartAt = 0;
        return $scope;
      };

      /**
       * Opens this extension in a new window
       * @return {void}
       */
      $scope.windowDetach = function () {
        if ($scope.windowDetached) { return; }
        var w = 1024, h = 768;
        chrome.windows.create(
          {
            url: 'views/default.html',
            type: 'popup',
            width: w,
            height: h,
            left: Math.round((screen.availWidth - w) / 2),
            top: Math.round((screen.availHeight - h) / 2)
          },
          function () {
            window.close();
          }
        );
      };

      /**
       * Opens the settings section in a new tab
       * @return {void}
       */
      $scope.tabSettings = function () {
        chrome.tabs.create({active: true, url: cjSettings.getUriSettings()});
      };

      /**
       * Opens the feedback form in a new tab
       * @return {void}
       */
      $scope.tabFeedback = function () {
        chrome.tabs.create({active: true, url: cjSettings.getUriFeedback()});
      };

      /**
       * Opens JIRA with the issue link in a new window
       * @param {Object} issue
       * @return {void}
       */
      $scope.tabIssue = function (issue) {
        chrome.tabs.create({
          active: false,
          url: [$scope.account.url, 'browse', issue.key].join('/')
        });
      };

      $scope.issueFocus = function (event, issue) {
        if (event.which === 2) {
          $scope.tabIssue(issue);
          return;
        }
        $scope.issueFocused = issue;
      };

      /**
       * Entry set corrections
       * @private
       * @param {Object} issue
       * @return {Object}
       */
      this._issueModify = function (issue) {
        issue._isClosed = (issue.fields.status.name === 'Closed');
        issue._colors = cjSettings.colors.priority[0];

        if (issue.fields.timeestimate) {
          issue.fields.timeestimate = moment.duration(issue.fields.timeestimate * 1000).humanize();
        }

        issue._size = cjSettings.colors
          .sizes[issue.fields.issuetype.name.toLowerCase()] || cjSettings.colors
          .sizes.task;

        if (issue.fields.priority && cjSettings.colors.priority[issue.fields.priority.id]) {
          issue._colors = cjSettings.colors.priority[issue.fields.priority.id];
        }

        return issue;
      };

      /**
       * Loads issues from the API
       * @private
       * @param {String} jql
       * @param {Number} [offset=0]
       * @param {Number} [limit=10]
       * @return {Object}
       */
      this._issueSearch = function (jql, offset, limit) {
        const query = {
          jql: jql,
          startAt: +offset || 0,
          maxResults: +limit || 10,
          expand: 'transitions',
          fields: '*navigable'
        };

        return $q((resolve, reject) => {
          $scope.api.myself((err, flag) => {
            if (err || !flag) { return reject(err ? err : new Error('Unable to identify myself')); }
            $scope.api.search(query, (err2, data) => err2 ? reject(err2) : resolve(data));
          });
        });
      };

      $scope.$on('issueOpenInNewTab', function (event, entry) {
        $scope.tabIssue(entry);
      });

      $scope.$on('issueTransitionChanged', function (event, entry) {
        self
          ._issueSearch('id = %d'.replace('%d', entry.id))
          .then(data => {
            data.issues.forEach(issue => {
              const idx = _.findIndex($scope.issues, {id: issue.id});
              $scope.issues[idx] = self._issueModify(issue);
            });
          });
      });

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
      });

      $rootScope.$on('jiraRequestFail', function (event, args) {
        $scope.jiraRequestFailed = [_.capitalize(args[0]), args[1].join('; ')];
        $scope.loading = false;
      });

      $scope.$watch('filterFieldDisplay', function (flag) {
        if (flag) {
          $timeout(() => $('#filter input').focus(), 100, false);
        }
      });

      $scope.$watch('loading', function (flag) {
        var $tiles = $('div.tiles');
        $('div.container').height($tiles.stop(true)[flag ? 'fadeOut' : 'fadeIn']('fast').height());

        if (!flag) { return; }
        $scope.jiraRequestFailed = false;
        $scope.filterFieldDisplay = false;
      });
    }]
  );
