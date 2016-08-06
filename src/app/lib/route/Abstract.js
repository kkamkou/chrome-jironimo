'use strict';

class RouteAbstract {
  constructor($scope, $settings) {
    this.scope = $scope;
    this.settings = $settings;
    $scope.notifications = [];
  }
}
