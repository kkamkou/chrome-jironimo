/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

angular
  .module('jironimo')
  .controller(
    'SettingsController',
    function ($scope, $location, $filter, cjSettings, cjJira) {
      $scope.tabControl = {colors: 'theme'};

      $scope.notifications = [];

      angular.forEach(
        ['account', 'colors', 'timer', 'workspaces'],
        function (name) {
          $scope[name] = cjSettings[name];
        }
      );

      $scope.workspaceAdd = function () {
        if ($scope.workspaces.length > 10) { return; }

        $scope.workspaces.push(
          {title: null, query: null, isDefault: false, icon: 'bug'}
        );
      };

      $scope.workspaceSetAsDefault = function (workspace) {
        angular.forEach($scope.workspaces, function (entry) {
          if (entry.isDefault) {
            entry.isDefault = false;
          }
          entry.isDefault = (entry === workspace);
        });
      };

      $scope.workspaceRemove = function (workspace) {
        if ($scope.workspaces.length < 2) { return; }

        $scope.workspaces = _.filter($scope.workspaces, function (entry) {
          return entry !== workspace;
        });

        if (workspace.isDefault) {
          $scope.workspaceSetAsDefault($scope.workspaces[0]);
        }
      };

      $scope.workspaceImport = function () {
        cjJira.filterFavourite(function (err, data) {
          if (err) {
            $scope.notifications.push({type: 'error', message: err.message});
            return;
          }

          var workspaces = _.pluck($scope.workspaces, 'query'),
            favs = _.pluck(data, 'jql'),
            count = 0;

          _.difference(favs, workspaces).forEach(function (jql) {
            count++;
            $scope.workspaces.push({
              isDefault: false,
              title: _.find(data, {jql: jql}).name,
              query: jql,
              icon: 'heart-2'
            });
          });

          $scope.notifications.push({
            type: 'success',
            message: $filter('i18n')('msgWorkspaceImportSuccess', [count])
          });
        });
      };

      $scope.workspaceQueryIsValidForWatch = function (query) {
        return (/\bupdated(date)?\b/).test(query.toLowerCase());
      };

      $scope.save = function (type, data) {
        if (!data) { return; }

        if (type === 'account') {
          data.url = data.url.replace(/\/+$/, '');
          data.timeout = parseInt(data.timeout, 10) || 10;
        }

        cjSettings[type] = angular.copy(data);

        $scope.notifications.push(
          {type: 'success', message: $filter('i18n')('msgOptionsSaveSuccess')}
        );

        // checking permissions for the url
        /* issue #70
          chrome.permissions.request({origins: [data.url + '/']}, function (flag) {
            if (!flag) { return false; }
            cjSettings[type] = angular.copy(data);
          });
        */
      };
    }
  )
  .directive('navigation', function () {
    return {
      templateUrl: 'macros/options-navigation.html',
      restrict: 'E',
      scope: {current: '@'},
      controller: function ($scope, $location) {
        $scope.entries = [
          {icon: 'key', id: 'account', title: 'Account information'},
          {icon: 'bug', id: 'jql', title: 'Workspaces'},
          {icon: 'sun-3', id: 'colors', title: 'Colors'},
          {icon: 'clock', id: 'timer', title: 'Time logging'},
          {icon: 'info-2', id: 'about', title: 'About'}
        ];

        $scope.goTo = function (entry) {
          $location.path('/settings/' + entry.id);
          return false;
        };
      }
    };
  });
