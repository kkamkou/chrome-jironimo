/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

angular
  .module('jironimo.tile')
  .directive('tileTransitions', ['cjJira', function (cjJira) {
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
          const query = {_method: 'POST', transition: {id: transition.id}};
          cjJira.current().transitions(entry.id, query, err => {
            if (err) { return; }
            elem.fadeOut('fast', () => $scope.$emit('issueTransitionChanged', entry, transition));
          });
        };
      }
    };
  }]);
