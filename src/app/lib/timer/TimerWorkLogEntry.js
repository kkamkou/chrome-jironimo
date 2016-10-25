/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class /* */ TimerWorkLogEntry {
  constructor(id, state, timestamp) {
    this._id = id;
    this._state = state || 'STOPPED';
    this._timestamp = timestamp || Date.now();

    if (!~['STOPPED', 'STARTED'].indexOf(this._state)) {
      throw new TypeError('Unknown state: ' + this._state);
    }
  }

  get id() {
    return this._id;
  }

  get started() {
    return this._state === 'STARTED';
  }

  get stopped() {
    return this._state === 'STOPPED';
  }

  get duration() {
    return Date.now() - this._timestamp;
  }

  resume() {
    this._state = 'STARTED';
  }

  start() {
    this._timestamp = Date.now();
    this._state = 'STARTED';
  }

  stop() {
    this._state = 'STOPPED';
  }

  toJSON() {
    return {id: this._id, state: this._state, timestamp: this._timestamp};
  }
}
