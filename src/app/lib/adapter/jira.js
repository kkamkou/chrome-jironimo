/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class Jira {
  constructor(request, url, timeout) {
    this._request = request;
    this._url = '' + url;
    this._timeout = parseInt(timeout, 10) || 10000;
    this._cache = {};
  }

  /**
   * The status of the authorisation
   * @param {Function} callback
   */
  authenticated(callback) {
    this.myself((err, flag) => callback(null, !err && _.get(flag, 'active', false)));
  }

  /**
   * Currently logged user
   * @param {Function} callback
   */
  myself(callback) {
    if (this._cache.myself) {
      return callback(null, this._cache.myself);
    }
    this._makeRequest('/api/latest/myself', {}, (err, data) => {
      if (!err) { this._cache.myself = data; }
      return callback(err, data);
    });
  }

  /**
   * Searches for issues using JQL
   * @param {Object} data
   * @param {Function} callback
   */
  search(data, callback) {
    this._makeRequest('/api/latest/search', data, callback);
  }

  /**
   * Returns the favourite filters of the logged-in user
   * @param {Function} callback
   */
  filterFavourite(callback) {
    this._makeRequest('/api/latest/filter/favourite', {}, callback);
  }

  /**
   * Assigns an issue to a user
   * @param {Number} issueId
   * @param {String} userName
   * @param {Function} callback
   */
  issueAssignee(issueId, data, callback) {
    this._makeRequest(`/api/latest/issue/${issueId}/assignee`, data, callback);
  }

  /**
   * Adds a new worklog entry to an issue
   * @param {Number} issueId
   * @param {Object} data
   * @param {Function} callback
   */
  issueWorklog(issueId, data, callback) {
    this._makeRequest(
      `/api/latest/issue/${issueId}/worklog?adjustEstimate=auto`,
      data, callback
    );
  }

  /**
   * Perform a transition on an issue
   * @param {Number} issueId
   * @param {Object} data
   * @param {Function} callback
   */
  transitions(issueId, data, callback) {
    this._makeRequest(
      `/api/latest/issue/${issueId}/transitions?expand=transitions.fields`,
      data, callback
    );
  }

  /**
   * Makes request with the data set
   * @private
   * @param {String} urn
   * @param {Object} dataSet
   * @param {Function} callback
   */
  _makeRequest(urn, dataSet, callback) {
    var callOptions = {
      method: 'GET',
      url: `${this._url}/rest${urn}`,
      cache: false,
      data: dataSet,
      responseType: 'json',
      timeout: this._timeout,
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

    this._request.fetch(callOptions)
      .then(r => callback(null, r.toJson()))
      .catch(e => {
        console.error(e);
        let err = e;
        if (e instanceof Response) {
          err = new Error(e.toJson());
          err.code = e.code;
        }
        callback(err);
      });
  }
}
