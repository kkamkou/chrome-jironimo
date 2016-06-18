/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

angular
  .module(
    'jironimo',
    ['ngRoute', 'ngSanitize', 'jironimo.settings', 'jironimo.jira',
     'jironimo.notifications', 'jironimo.timer', 'jironimo.shared',
     'jironimo.tile']
  )
  .config(
    ['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {
      $compileProvider.debugInfoEnabled(false);
      $routeProvider
        .when('/', {
          templateUrl: '/views/index.html',
          controller: 'IndexController'
        })
        .when('/settings/account', {
          templateUrl: '/views/options-account.html',
          controller: 'SettingsController'
        })
        .when('/settings/colors', {
          templateUrl: '/views/options-colors.html',
          controller: 'SettingsController'
        })
        .when('/settings/jql', {
          templateUrl: '/views/options-jql.html',
          controller: 'SettingsController'
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
      if (cjSettings.account.sync) {
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
