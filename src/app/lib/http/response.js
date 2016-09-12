/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class Response {
  constructor(data, code) {
    this._body = data;
    this._code = +code;
  }

  get code() {
    return this._code;
  }

  toJson() {
    return this._body;
  }
}
