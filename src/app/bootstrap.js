angular
  .module('jironimo', [])
  .config(function ($routeProvider) {
      // default action
      $routeProvider.when('/', {
        templateUrl: '/views/index.html',
        controller: IndexController
      });

      // settings account action
      $routeProvider.when('/settings', {
        templateUrl: '/views/options-account.html',
        controller: SettingsController
      });

      // settings colors action
      $routeProvider.when('/settings/colors', {
        templateUrl: '/views/options-colors.html',
        controller: SettingsController
      });

      // settings jql action
      $routeProvider.when('/settings/jql', {
        templateUrl: '/views/options-jql.html',
        controller: SettingsController
      });

      // settings timer action
      $routeProvider.when('/settings/timer', {
        templateUrl: '/views/options-timer.html',
        controller: SettingsController
      });

      // fallback action
      $routeProvider.otherwise({redirectTo: '/'});
    }
  )
  .run(function ($rootScope) {
    $rootScope.cjSettings = new CjSettings();
    $rootScope.cjJira = new CjJiraApi($rootScope.cjSettings.account);
  });

// some services
IndexController.$inject = ['$scope', 'notify'];
