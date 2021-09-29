/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class RouteAbstract {
  constructor($scope, $injector, scopeMethods) {
    this.injector = $injector;
    this.scope = $scope;

    // reset the $scope
    this.scope.notifications = [];
    (scopeMethods || []).forEach(m => this.scope[m] = this[m].bind(this));
  }

  service(name) {
    const service = this.injector.get(name);
    if (!service) {
      throw new TypeError(`Unknown service "${name}"`);
    }
    return service;
  }
}
