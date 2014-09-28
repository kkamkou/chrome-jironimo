/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */

angular
  .module(
      'jironimo',
      ['ngRoute', 'ngSanitize', 'jironimo.settings', 'jironimo.jira', 'jironimo.notifications', 'jironimo.timer']
  )
  .config(
    function ($routeProvider) {
      // default action
      $routeProvider.when('/', {
        templateUrl: '/views/index.html',
        controller: 'IndexController'
      });

      // settings account action
      $routeProvider.when('/settings', {
        templateUrl: '/views/options-account.html',
        controller: 'SettingsController'
      });

      // settings colors action
      $routeProvider.when('/settings/colors', {
        templateUrl: '/views/options-colors.html',
        controller: 'SettingsController'
      });

      // settings jql action
      $routeProvider.when('/settings/jql', {
        templateUrl: '/views/options-jql.html',
        controller: 'SettingsController'
      });

      // settings timer action
      $routeProvider.when('/settings/timer', {
        templateUrl: '/views/options-timer.html',
        controller: 'SettingsController'
      });

      // settings about action
      $routeProvider.when('/settings/about', {
        templateUrl: '/views/options-about.html',
        controller: 'SettingsController'
      });

      // fallback action
      $routeProvider.otherwise({redirectTo: '/'});
    }
  )
  .run(
    function (cjSettings) {
      // synchronise settings
      if (cjSettings.account.sync) {
        chrome.storage.sync.get(cjSettings.getStorageData(), function (items) {
          cjSettings.setStorageData(items);
        });
      }
    }
  );
