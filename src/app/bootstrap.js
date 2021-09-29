/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

'use strict';

angular
  .module(
    'jironimo',
    ['ngRoute', 'ngSanitize', 'jironimo.settings', 'jironimo.jira', 'jironimo.timer',
     'jironimo.notifications', 'jironimo.shared', 'jironimo.tile']
  )
  .controller('RouteSettingsGeneral', ['$scope', '$injector', RouteSettingsGeneral])
  .controller('RouteSettingsWorkspace', ['$scope', '$injector', RouteSettingsWorkspace])
  .config(
    ['$routeProvider', '$compileProvider', '$locationProvider', function ($routeProvider, $compileProvider, $locationProvider) {
      $locationProvider.hashPrefix('');
      $compileProvider.debugInfoEnabled(true);
      $routeProvider
        .when('/', {
          templateUrl: '/views/index.html',
          controller: 'IndexController'
        })
        .when('/settings/general', {
          templateUrl: '/views/options-general.html',
          controller: 'RouteSettingsGeneral'
        })
        .when('/settings/colors', {
          templateUrl: '/views/options-colors.html',
          controller: 'SettingsController'
        })
        .when('/settings/jql', {
          templateUrl: '/views/options-jql.html',
          controller: 'RouteSettingsWorkspace'
        })
        .when('/settings/timer', {
          templateUrl: '/views/options-timer.html',
          controller: 'SettingsController'
        })
        .when('/settings/about', {
          templateUrl: '/views/options-about.html',
          controller: 'SettingsController'
        })
        .otherwise({redirectTo: '/'});
    }]
  )
  .run(
    ['cjSettings', function (cjSettings) {
      if (cjSettings.general.sync && chrome.storage.sync) {
        chrome.storage.sync.get(cjSettings.getStorageData(), function (items) {
          cjSettings.setStorageData(items);
        });
      }
    }]
  )
  .directive('integer', function () {
    return {
      require: 'ngModel',
      link: function (scope, ele, attr, ctrl) {
        ctrl.$parsers.unshift(function (val) {
          return parseInt(val, 10);
        });
        ctrl.$formatters.push(function (val) {
          return '' + val;
        });
      }
    };
  });
