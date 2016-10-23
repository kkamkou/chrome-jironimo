/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

angular
  .module('jironimo.tile')
  .directive('tile', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {entry: '=', timer: '=', api: '='},
      templateUrl: 'tile/tile.html'
    };
  });
