/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class RouteAbstract {
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
