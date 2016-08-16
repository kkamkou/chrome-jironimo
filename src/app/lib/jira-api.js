/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

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
    const cache = {};

    /**
     * Currently logged user
     *
     * @public
     * @param {Function} callback
     */
    this.myself = function (callback) {
      if (cache.myself) {
        return callback(null, cache.myself);
      }

      this._makeRequest('/api/latest/myself', {}, (err, data) => {
        if (!err) {
          cache.myself = data;
        }
        callback(err, data);
      });
    };

    /**
     * Searches for issues using JQL
     *
     * @public
     * @param {Object} data
     * @param {Function} callback
     */
    this.search = function (data, callback) {
      this._makeRequest('/api/latest/search', data, callback);
    };

    /**
     * Returns the favourite filters of the logged-in user
     *
     * @public
     * @param {Function} callback
     */
    this.filterFavourite = function (callback) {
      this._makeRequest('/api/latest/filter/favourite', {}, callback);
    };

    /**
     * Assigns an issue to a user
     *
     * @public
     * @param {Number} issueId
     * @param {String} userName
     * @param {Function} callback
     */
    this.issueAssignee = function (issueId, data, callback) {
      this._makeRequest(`/api/latest/issue/${issueId}/assignee`, data, callback);
    };

    /**
     * Adds a new worklog entry to an issue
     *
     * @public
     * @param {Number} issueId
     * @param {Object} data
     * @param {Function} callback
     */
    this.issueWorklog = function (issueId, data, callback) {
      this._makeRequest(
        `/api/latest/issue/${issueId}/worklog?adjustEstimate=auto`,
        data, callback
      );
    };

    /**
     * Perform a transition on an issue
     *
     * @public
     * @param {Number} issueId
     * @param {Object} data
     * @param {Function} callback
     */
    this.transitions = function (issueId, data, callback) {
      this._makeRequest(
        `/api/latest/issue/${issueId}/transitions?expand=transitions.fields`,
        data, callback
      );
    };

    /**
     * Makes request with the data set
     *
     * @private
     * @param {String} urn
     * @param {Object} dataSet
     * @param {Function} callback
     */
    this._makeRequest = function (urn, dataSet, callback) {
      var config = cjSettings.account;

      if (!config.url) {
        return callback(new Error($filter('i18n')('jiraApiUrlRequired')));
      }

      var callOptions = {
        method: 'GET',
        url: config.url + '/rest' + urn,
        cache: false,
        data: dataSet,
        responseType: 'json',
        timeout: config.timeout * 1000,
        headers: {ContentType: 'application/json; charset=UTF-8'}
      };

      // different method
      if (callOptions.data._method) {
        callOptions.method = callOptions.data._method.toUpperCase();
        delete callOptions.data._method;
      }

      // angular params;data fix
      if (callOptions.method === 'GET') {
        callOptions.params = callOptions.data;
        delete callOptions.data;
      }

      // ajax object
      $http(callOptions)
        .success(json => callback(null, json))
        .error(err => callback(new Error(err || $filter('i18n')('jiraApiConnectionProblem'))));
    };
  }]);
