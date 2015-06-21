/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

angular
  .module('jironimo.tile')
  .directive('tileProgress', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {percent: '@', colorBg: '@'},
      templateUrl: 'tile/progress.html',
      link: function ($scope) {
        $scope.percent = parseInt($scope.percent, 10) || 0;
        if ($scope.percent < 0) {
          $scope.percent = 0;
        }
        if ($scope.percent > 100) {
          $scope.percent = 100;
        }
      }
    };
  });
