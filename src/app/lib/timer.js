/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

/*final public*/class CjWorkLogEntry {
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

angular
  .module('jironimo.timer', ['jironimo.jira', 'jironimo.settings'])
  .factory('cjTimer', ['cjJira', 'cjSettings', function (cjJira, cjSettings) {
    return {
      instance: function (account) {
        const storage = {},
          activity = _.get(cjSettings.activity, `lastWorkspace.${account.id}.timers`, {});

        Object.keys(activity).forEach(k =>
          storage[k.split(';')[0]] =
            new CjWorkLogEntry(activity[k].id, activity[k].state, activity[k].timestamp)
        );

        function persist() {
          const timers = {};
          Object.keys(storage).forEach(k => timers[k + ';jira'] = storage[k].toJSON());
          cjSettings.activity =
            _.set(cjSettings.activity, `lastWorkspace.${account.id}.timers`, timers);

          // chrome.browserAction.setBadgeText({text: '00:00'});
        }

        return {
          /**
           * Returns true if timer for this issue already started
           * @param {object} issue
           * @return {boolean}
           */
          isStarted: function (issue) {
            return storage[issue.id] ? storage[issue.id].started : false;
          },

          /**
           * Returns true if timer for this issue can be started
           * @param {object} issue
           * @return {boolean}
           */
          canBeStarted: function (issue) {
            // default flag
            let flag = cjSettings.timer.enabled && !this.isStarted(issue)
              && _.get(issue, 'fields.status.name') !== 'Closed'; // @todo! not trusted

            // only one active ticket
            if (cjSettings.timer.singleton) {
              flag = flag && !_.find(storage, entry => entry.started);
            }

            return flag;
          },

          /**
           * Returns true if timer for this issue can be stopped
           * @param {object} issue
           * @return {boolean}
           */
          canBeStopped: function (issue) {
            return this.isStarted(issue);
          },

          /**
           * Returns elapsed time for the current issue (humanized)
           * @param {object} issue
           * @return {string}
           */
          elapsedTime: function (issue) {
            return this.isStarted(issue)
              ? moment.duration(storage[issue.id].duration).humanize()
              : '?';
          },

          /**
           * Starts timer for the current issue
           * @param {object} issue
           */
          start: function (issue) {
            if (!storage[issue.id]) {
              storage[issue.id] = new CjWorkLogEntry(issue.id);
            }
            storage[issue.id].start();
            persist();
          },

          /**
           * Ends timer for the current issue
           * @param {object} issue
           */
          stop: function (issue) {
            if (!this.canBeStopped(issue)) { return; }

            const dur = storage[issue.id].duration,
              diff = Math.ceil(dur / 1000);

            if (!diff) { return; } // diff is zero (fast-click?)

            persist(); // transaction

            storage[issue.id].stop();

            // data set for the work-log request
            var dataSet = {
              _method: 'POST',
              comment: moment.duration(dur).humanize(),
              timeSpent: (diff > 60 ? Math.ceil(diff / 60) : 1) + 'm'
            };

            cjJira.current().issueWorklog(issue.id, dataSet, err => {
              if (!err) {
                delete storage[issue.id];
                return persist();
              }
              storage[issue.id].resume(); // rollback if error
            });
          },

          /**
           * Stops timer without time-logging
           * @param {object} issue
           */
          discard: function (issue) {
            if (!this.canBeStopped(issue)) { return; }
            delete storage[issue.id];
            persist();
          }
        };
      }
    };
  }]);
