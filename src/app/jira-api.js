function JiraApi(settings) {
  var isAuthenticated = false;

  this.isAuthenticated = function (callback) {
    this._makeRequest('/auth/latest/session', {}, function (err, data) {
      return (!err && data.loginInfo);
    });
  };

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
      messages = loginReason
        ? [loginReasonSet[loginReason]]
        : angular.fromJson(err.responseText).errorMessages;

      // custom message
      $('body').append(
        '<div class="error-bar">' +
          '<h3 class="fg-color-white">' + err.statusText + '</h3>' +
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
  return new JiraApi(angular.fromJson(localStorage.account));
});
