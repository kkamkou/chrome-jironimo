/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

angular
  .module('jironimo.shared')
  .directive('pagination', function () {
    return {
      templateUrl: 'shared/pagination.html',
      restrict: 'E',
      replace: true,
      scope: {position: '=', limit: '=', total: '=', callback: '='},
      link: function ($scope) {
        function pageAt(pos, limit) {
          return pos ? parseInt(pos / limit, 10) : 0;
        }

        function positionAt(page, limit) {
          if (page > $scope.pages) {
            page = $scope.pages;
          }
          if (page < 0) {
            page = 0;
          }
          return page * limit;
        }

        $scope.$watchGroup(['total', 'limit', 'position'], function (vals) {
          $scope.page = pageAt(vals[2], $scope.limit);
          $scope.pages = Math.ceil(vals[0] / vals[1]);
          $scope.hasPrev = ($scope.page > 0);
          $scope.hasNext = ($scope.page < $scope.pages - 1);
        });

        $scope.first = function () {
          $scope.callback(0, $scope.limit);
        };

        $scope.last = function () {
          $scope.callback(positionAt($scope.pages - 1, $scope.limit), $scope.limit);
        };

        $scope.prev = function () {
          $scope.callback(positionAt($scope.page - 1, $scope.limit), $scope.limit);
        };

        $scope.next = function () {
          $scope.callback(
            positionAt(pageAt($scope.position, $scope.limit) + 1, $scope.limit),
            $scope.limit
          );
        };
      }
    };
  });
