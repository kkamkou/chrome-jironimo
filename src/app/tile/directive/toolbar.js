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
      scope: {account: '=', api: '=', entry: '=', timer: '='},
      templateUrl: 'tile/toolbar.html',
      link: function ($scope) {
        $scope.timerStart = function (issue) {
          if (issue.fields.assignee) {
            $scope.timer.start(issue);
            return;
          }

          $scope.api.myself((err1, info) => {
            if (err1) { return; }

            var notifyId = ['issue', $scope.account.id, issue.key].join(';'),
              paramsQuery = {_method: 'PUT', name: info.name},
              notifyParams = {
                title: issue.key,
                message: $filter('i18n')('notificationAssignedToMe')
              };

            $scope.api.issueAssignee(issue.key, paramsQuery, err2 => {
              if (err2) { return; }
              $scope.$emit('tileModified', issue);
              cjNotifications.createOrUpdate(notifyId, notifyParams, () =>
                $scope.$apply(() => $scope.timer.start(issue))
              );
            });
          });
        };
      }
    };
  }]);
