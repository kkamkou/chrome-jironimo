/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

angular
  .module('jironimo.tile')
  .directive('tileTransitions', function (cjJira) {
    return {
      restrict: 'E',
      replace: true,
      scope: {entry: '='},
      templateUrl: 'tile/transitions.html',
      link: function ($scope, elem) {
        $scope.close = function () {
          elem.fadeOut('fast');
          return;
        };

        $scope.modify = function (entry, transition) {
          var dataSet = {
            _method: 'POST',
            transition: {id: transition.id}
          };

          cjJira.transitions(entry.id, dataSet, function (err) {
            if (err) { return; }
            elem.fadeOut('fast', function () {
              $scope.$emit('issueTransitionChanged', entry, transition);
            });
          });
        };
      }
    };
  });
