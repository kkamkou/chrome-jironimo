/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

angular
  .module('jironimo.jira', ['jironimo.settings'])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(['$q', '$rootScope', '$filter', function ($q, $rootScope, $filter) {
      return {
        responseError: function (rej) {
          var messages = [
            $filter('i18n')('jiraApiUknownResponse'),
            $filter('i18n')('jiraApiCheckSettings')
          ],
          loginReason = rej.headers()['x-seraph-loginreason'],
          loginReasonSet = {
            AUTHENTICATION_DENIED: 'jiraApiAuthenticationDenied',
            AUTHENTICATED_FAILED: 'jiraApiAuthenticationFailed',
            AUTHORISATION_FAILED: 'jiraApiAuthorizationFailed',
            OUT: 'jiraApiLoggedOut'
          };

          // error messages
          if (rej.headers()['x-authentication-denied-reason']) {
            messages = [rej.headers()['x-authentication-denied-reason']];
          } else if (loginReason && rej.status > 400 && rej.status < 500) {
            messages = [$filter('i18n')(loginReasonSet[loginReason])];
          } else if (rej.status === 500) {
            messages = [$filter('i18n')('jiraApiCheckConfig')];
          } else if (rej.data && rej.data.errorMessages) {
            messages = rej.data.errorMessages;
          }

          // custom message
          $rootScope.$emit(
            'jiraRequestFail',
            [$filter('i18n')('statusCode' + rej.status), messages]
          );

          return $q.reject(rej);
        }
      };
    }]);
  }])
  .service('cjJira', ['$rootScope', 'cjSettings', '$http', '$filter', function ($rootScope, cjSettings, $http, $filter) {
    const adapter = new Jira(
      new Request($http), cjSettings.accounts[0].url, cjSettings.accounts[0].timeout * 1000
    );

/*console.log('adapter');
return adapter;
    if (!config.url) {
      return callback(new Error($filter('i18n')('jiraApiUrlRequired')));
    }*/



    /*$http(callOptions)
      .success(json => callback(null, json))
      .error(err => callback(new Error(err || $filter('i18n')('jiraApiConnectionProblem'))));*/

    return adapter;
  }]);
