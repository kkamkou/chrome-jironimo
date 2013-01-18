function CjJiraApi(settings) {
  /**
   * Check if use is authenticated or not
   *
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
   * @param {String} query
   * @param {Function} callback
   */
  this.search = function (query, callback) {
    this._makeRequest('/api/latest/search', {jql: query}, callback);
  };

  this._makeRequest = function (urn, dataSet, callback) {
    // ajax object
    var call = $.ajax({
      type: 'GET',
      url: this._getJiraUrl() + '/rest' + urn,
      cache: false,
      data: dataSet,
      dataType: 'json',
      timeout: 5000,
      headers: {Authorization: this._getAuthHeader()}
    });

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

  /**
   * Returns the authorization header
   *
   * @return {String}
   */
  this._getAuthHeader = function () {
    return 'Basic ' + window.btoa(settings.login + ':' + settings.password);
  };

  /**
   * Returns correct url of the JIRA tracker
   *
   * @return {String}
   */
  this._getJiraUrl = function () {
    return settings.url.replace(/\/$/, '');
  };
}

jironimo.factory('jrApi', function () {
  return new CjJiraApi(jironimoSettings.account);
});
