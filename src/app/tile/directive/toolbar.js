/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

angular
  .module('jironimo.tile')
  .directive('tileToolbar', ['cjNotifications', '$filter', function (cjNotifications, $filter) {
    return {
      restrict: 'E',
      replace: true,
      scope: {entry: '=', timer: '=', api: '='},
      templateUrl: 'tile/toolbar.html',
      link: function ($scope) {
        $scope.timerStart = function (issue) {
          if (issue.fields.assignee) {
            $scope.timer.start(issue);
            return;
          }

          $scope.api.myself((err1, info) => {
            if (err1) { return; }

            var paramsQuery = {_method: 'PUT', name: info.name},
              paramsNotify = {
                title: issue.key,
                message: $filter('i18n')('notificationAssignedToMe')
              };

            $scope.api.issueAssignee(issue.key, paramsQuery, err2 => {
              if (err2) { return; }
              cjNotifications.createOrUpdate(issue.key, paramsNotify, () =>
                $scope.$apply(() => $scope.timer.start(issue))
              );
            });
          });
        };
      }
    };
  }]);
