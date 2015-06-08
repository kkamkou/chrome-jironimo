/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

angular
  .module('jironimo.shared')
  .directive(
    'notify',
    function ($timeout) {
      return {
        restrict: 'E',
        scope: {entries: '=', count: '@'},
        templateUrl: 'macros/notify.html',
        link: function ($scope, elem) {
          $scope.$watchCollection('entries', function () {
            if (!$scope.entries.length) {
              elem.hide();
              return;
            }

            var $elem = elem.show().find('div.notify-entry:hidden:last')
              .hide().fadeIn('fast');

            $timeout(function () {
              $elem.slideUp('fast', $scope.entries.shift);
            }, 5000);
          });
        }
      };
    }
  );
