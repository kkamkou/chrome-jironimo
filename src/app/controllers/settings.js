/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */
function SettingsController($scope, $location, cjSettings, cjJira) {
  // defining dynamic data
  angular.forEach(
    ['account', 'colors', 'timer', 'workspaces'], function (name) {
      $scope[name] = cjSettings[name];
    }
  );

  $scope.workspaceAdd = function () {
    if ($scope.workspaces.length > 10) {
      return false;
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
      return false;
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
      if (err) {
        return;
      }

      var workspaces = _.pluck($scope.workspaces, 'query'),
        favs = _.pluck(data, 'jql');

      _.difference(favs, workspaces).forEach(function (jql) {
        $scope.workspaces.push(
          {title: _.find(data, {jql: jql}).name, query: jql, isDefault: false, icon: 'heart-2'}
        );
      });

      $scope.$apply();
    });
  };

  $scope.workspaceQueryIsValidForWatch = function (query) {
    return /\bupdated(date)?\b/.test(query.toLowerCase());
  };

  /**
   * Saves settings
   *
   * @param {String} type
   * @param {Object} data
   * @return {Boolean}
   */
  $scope.save = function (type, data) {
    if (!data) {
      return false;
    }

    // some normalization
    if (type === 'account') {
      data.url = data.url.replace(/\/$/, '');
      data.timeout = parseInt(data.timeout, 10) || 10;
    }

    cjSettings[type] = angular.copy(data);
    return true;
  };

  /**
   * Chnages the location path
   *
   * @param  {string} route
   * @return {boolean}
   */
  $scope.goTo = function (route) {
    $location.path(route);
    return false;
  };
}
