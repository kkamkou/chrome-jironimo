/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

'use strict';

angular
  .module('jironimo')
  .controller('SettingsController', [ // deprecated controller!
    '$scope', '$location', '$filter', 'cjSettings',
    function ($scope, $location, $filter, cjSettings) {
      angular.forEach(['colors', 'timer', 'workspaces'], k => $scope[k] = cjSettings[k]);

      $scope.tabControl = {colors: 'theme'};

      $scope.notifications = [];

      $scope.save = function (type, data) {
        if (!data) { return; }

        cjSettings[type] = angular.copy(data);

        $scope.notifications.push(
          {type: 'success', message: $filter('i18n')('msgOptionsSaveSuccess')}
        );
      };
    }]
  )
  .directive('navigation', function () {
    return {
      templateUrl: 'macros/options-navigation.html',
      restrict: 'E',
      scope: {current: '@'},
      controller: ['$scope', '$location', function ($scope, $location) {
        $scope.entries = [
          {icon: 'key', id: 'general', title: 'optionsGeneralTitle'},
          {icon: 'bug', id: 'jql', title: 'optionsJqlWorkspacesTitle'},
          {icon: 'sun-3', id: 'colors', title: 'optionsColorsTitle'},
          {icon: 'clock', id: 'timer', title: 'optionsTimerTitle'},
          {icon: 'info-2', id: 'about', title: 'optionsAboutTitle'}
        ];

        $scope.goTo = function (entry) {
          $location.path('/settings/' + entry.id);
          return false;
        };
      }]
    };
  });
