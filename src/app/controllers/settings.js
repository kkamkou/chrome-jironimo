// default options
if (localStorage.settings) {
  localStorage.settings = {};
  localStorage.settings.account = {url: '', login: '', password: ''};
}

function SettingsController($scope) {
  $scope.save = function (type, data) {
    if (data) {
      localStorage.account = angular.toJson(angular.copy(data));
    }
    return false;
  };
};
