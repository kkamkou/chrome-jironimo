'use strict';

class RouteAbstract {
  constructor($scope) {
    this.services = angular.injector(['jironimo']);
    this.scope = $scope;

    // reset notifications
    $scope.notifications = [];
  }
}
