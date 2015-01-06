/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */

angular
  .module('jironimo')
  .controller(
    'SettingsController',
    function ($scope, $location, cjSettings, cjJira) {
      angular.forEach(['account', 'colors', 'timer', 'workspaces'], function (name) {
        $scope[name] = cjSettings[name];
      });

      $scope.workspaceAdd = function () {
        if ($scope.workspaces.length > 10) {
          return;
        }
        $scope.workspaces.push({title: null, query: null, isDefault: false, icon: 'bug'});
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
        if ($scope.workspaces.length < 2) {
          return;
        }

        $scope.workspaces = _.filter($scope.workspaces, function (entry) {
          return entry !== workspace;
        });

        if (workspace.isDefault) {
          $scope.workspaceSetAsDefault($scope.workspaces[0]);
        }
      };

      $scope.workspaceImport = function () {
        cjJira.filterFavourite(function (err, data) {
          if (err) { return; }

          var workspaces = _.pluck($scope.workspaces, 'query'),
            favs = _.pluck(data, 'jql');

          _.difference(favs, workspaces).forEach(function (jql) {
            $scope.workspaces.push(
              {title: _.find(data, {jql: jql}).name, query: jql, isDefault: false, icon: 'heart-2'}
            );
          });
        });
      };

      $scope.workspaceQueryIsValidForWatch = function (query) {
        return (/\bupdated(date)?\b/).test(query.toLowerCase());
      };

      $scope.save = function (type, data) {
        if (!data) {
          return false;
        }

        if (type === 'account') {
          data.url = data.url.replace(/\/$/, '');
          data.timeout = parseInt(data.timeout, 10) || 10;
        }

        cjSettings[type] = angular.copy(data);
        return true;
      };

      $scope.goTo = function (route) {
        $location.path(route);
        return false;
      };
    }
  );
