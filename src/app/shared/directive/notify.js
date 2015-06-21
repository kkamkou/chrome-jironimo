/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

angular
  .module('jironimo.shared')
  .directive('notify', function ($timeout) {
    return {
      templateUrl: 'shared/notify.html',
      restrict: 'E',
      replace: true,
      scope: {entries: '=', count: '@'},
      link: function ($scope, elem) {
        $scope.$watchCollection('entries', function () {
          if (!$scope.entries.length) {
            elem.hide();
            return;
          }

          var $elem = elem.show().find('div.notify-entry:hidden:last')
            .hide().slideDown('fast');

          $timeout(function () {
            $elem.slideUp('fast', $scope.entries.shift);
          }, 5000, false);
        });
      }
    };
  });
