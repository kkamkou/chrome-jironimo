// default settings for the colors section
if (!localStorage.colors) {
  localStorage.colors = '{"theme": "default"}';
}

function SettingsController($scope) {
  // defining dynamic data
  angular.forEach(['account', 'colors', 'timer'], function (name) {
    $scope[name] = angular.fromJson(localStorage[name]);
  });

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
