var jironimo = angular
  .module('default', [])
  .config(function($routeProvider) {
      // default action
      $routeProvider.when('/', {
        templateUrl: '/views/index.html',
        controller: 'IndexController'
      });

      // fallback action
      $routeProvider.otherwise({redirectTo: '/'});
    }
  );
