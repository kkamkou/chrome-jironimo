'use strict';

class RouteAbstract {
  constructor($scope, scopeMethods) {
    this.services = angular.injector(['jironimo']);
    this.scope = $scope;

    // reset the $scope
    this.scope.notifications = [];
    (scopeMethods || []).forEach(m => this.scope[m] = this[m].bind(this));
  }

  service(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new TypeError(`Unknown service "${name}"`);
    }
    return service;
  }
}
