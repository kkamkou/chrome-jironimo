/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class Request {
  constructor($http) {
    this._request = $http;
  }

  fetch(params) {
    return new Promise((resolve, reject) => {
      this._request(params)
        .then(r => resolve(new Response(r.data, r.status)))
        .catch(r => reject(new Response(r.data, r.status)));
    });
  }
}
