/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

angular
  .module('jironimo.tile')
  .directive('tileTransitions', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {api: '=', entry: '='},
      templateUrl: 'tile/transitions.html',
      link: function ($scope, elem) {
        $scope.close = () => elem.fadeOut('fast');
        $scope.modify = (entry, transition) => {
          elem.fadeOut('fast', () => {
            const query = {_method: 'POST', transition: {id: transition.id}};
            $scope.api.transitions(entry.id, query, err => {
              if (!err) {
                $scope.$emit('tileModified', entry);
              }
            });
          });
        };
      }
    };
  });
