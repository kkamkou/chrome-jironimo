angular
  .module('jironimo.jira', ['jironimo.settings'])
  .service('cjJira', function (cjSettings) {
    /**
     * Check if use is authenticated or not
     *
     * @public
     * @param {Function} callback
     */
    this.isAuthenticated = function (callback) {
      this._makeRequest('/auth/latest/session', {}, function (err, data) {
        callback(err, data);
      });
    };

    /**
     * Executes query
     *
     * @public
     * @param {String} query
     * @param {Function} callback
     */
    this.search = function (query, callback) {
      this._makeRequest('/api/latest/search', {jql: query}, callback);
    };

    /**
     * Makes request with the data set
     *
     * @param {String} urn
     * @param {Object} dataSet
     * @param {Function} callback
     * @private
     * @return {String}
     */
    this._makeRequest = function (urn, dataSet, callback) {
      // defaults
      var call,
        callOptions = {
          type: 'GET',
          url: cjSettings.account.url + '/rest' + urn,
          cache: false,
          data: dataSet,
          dataType: 'json',
          timeout: 5000,
          headers: {
            Authorization: 'Basic ' +
              window.btoa(cjSettings.account.login + ':' + cjSettings.account.password)
          }
        };

      // adding the HTTP Authorization
      if (cjSettings.account.http.login) {
        callOptions.username = cjSettings.account.http.login;
        callOptions.password = cjSettings.account.http.password || null;
      }

      // ajax object
      call = $.ajax(callOptions);

      // we are ok
      call.done(function (json) {
        return callback(null, json);
      });

      // something went wrong
      call.fail(function (err) {
        // defaults
        var messages = ['Unknown response from the JIRA&trade; API'],
          loginReason = err.getResponseHeader('X-Seraph-LoginReason'),
          loginReasonSet = {
            'AUTHENTICATION_DENIED': 'The user is not allowed to even attempt a login.',
            'AUTHENTICATED_FAILED': 'The user could not be authenticated.',
            'AUTHORISATION_FAILED': 'The user could not be authorised.',
            'OUT': 'The user has in fact logged "out"'
          };

        // error messages
        if (loginReason) {
          messages = [loginReasonSet[loginReason]];
        } else {
          if (err.responseText) {
            messages = angular.fromJson(err.responseText).errorMessages;
          }
        }

        // custom message
        $('body').append(
          '<div class="error-bar">' +
            '<h3 class="fg-color-white">' +
              S(err.statusText).capitalize().s +
            '</h3>' +
            '<p>' + messages.join(';') + '</p>' +
          '</div>'
        );

        // lets notice parents
        return callback(err);
      });
    };
  });
