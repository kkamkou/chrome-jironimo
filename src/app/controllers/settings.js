// default settings for the colors section
if (!localStorage.colors) {
  localStorage.colors = angular.toJson({theme: 'default'});
}

// default settings for the workspaces section
if (!localStorage.workspaces) {
  localStorage.workspaces = angular.toJson([{
    title: 'Default',
    query: 'assignee = currentUser() ORDER BY updatedDate DESC',
    default: true
  }]);
}

function SettingsController($scope) {
  // defining dynamic data
  angular.forEach(
    ['account', 'colors', 'timer', 'workspaces'], function (name) {
      $scope[name] = angular.fromJson(localStorage[name]);
    }
  );

  $scope.workspaceAdd = function () {
    if ($scope.workspaces.length > 10) {
      return false;
    }
    $scope.workspaces.push({title: null, query: null, default: false});
  };

  $scope.workspaceSetAsDefault = function (workspace) {
    angular.forEach($scope.workspaces, function(entry){
      if (entry.default) {
        entry.default = false;
      }
      entry.default = (entry === workspace);
    });
  };

  $scope.workspaceRemove = function (workspace) {
    if ($scope.workspaces.length < 2) {
      return false;
    }

    $scope.workspaces = _.filter($scope.workspaces, function (entry) {
      return entry !== workspace;
    });

    if (workspace.default) {
      $scope.workspaceSetAsDefault($scope.workspaces[0]);
    }
  };

  /**
   * Saves settings
   *
   * @param {String} type
   * @param {Object} data
   * @return {Boolean}
   */
  $scope.save = function (type, data) {
    if (data) {
      localStorage[type] = angular.toJson(angular.copy(data));
    }
    return false;
  };
}
