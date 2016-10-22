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
          } else if (rej.data && rej.data.message) {
            messages = [rej.data.message];
          }

          $rootScope
            .$emit('jiraRequestFail', [$filter('i18n')('statusCode' + rej.status), messages]);

          return $q.reject(rej);
        }
      };
    }]);
  }])
  .service('cjJira', ['$q', '$http', '$filter', function ($q, $http, $filter) {
    const cache = {};
    let lastActive;

    return {
      current: function () {
        return lastActive;
      },

      instance: function (account) {
        if (!cache[account.id]) {
          cache[account.id] = new Jira(
            new Request(
              config => $q((resolve, reject) =>
                $http(config).then(resolve).catch(err =>
                  reject(err.data ? err : $filter('i18n')('jiraApiConnectionProblem'))))
            ),
            account.url,
            account.timeout * 1000
          );
        }
        lastActive = cache[account.id];
        return cache[account.id];
      }
    };
  }]);
