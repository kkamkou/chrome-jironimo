/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

angular
  .module('jironimo.timer', ['jironimo.settings'])
  .factory('cjTimer', ['$rootScope', 'cjSettings', function ($rootScope, cjSettings) {
    return {
      instance: function (account, api) {
        const storage = {},
          activity = _.get(cjSettings.activity, `workspace.${account.id}.timers`, {});

        Object.keys(activity).forEach(
          k => storage[k] =
            new TimerWorkLogEntry(activity[k].id, activity[k].state, activity[k].timestamp)
        );

        return {
          /**
           * Updates the local storage
           * @returns {cjTimer}
           */
          persist: function () {
            const timers = {};

            Object.keys(storage).filter(k => storage[k].started)
              .forEach(k => timers[k] = storage[k].toJSON());

            cjSettings.activity =
              _.set(cjSettings.activity, `workspace.${account.id}.timers`, timers);

            return this;
          },

          /**
           * Resets the badge
           * @returns {cjTimer}
           */
          resetBadge: function () {
            const activity = _(cjSettings.activity.workspace).flatMap('timers').value(),
              cnt = activity.reduce((c, p) => c + _.size(p), 0);

            if (cnt < 1) {
              chrome.browserAction.setBadgeText({text: ''});
              return this;
            }

            if (cnt > 1) {
              chrome.browserAction.setBadgeText({text: cnt.toString()});
              return this;
            }

            const first = _.sample(_(activity).omitBy(_.isEmpty).sample());
            chrome.browserAction.setBadgeText(
              {text: moment(moment().diff(first.timestamp) - 3600000).format('HH:mm')}
            );

            return this;
          },

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
              storage[issue.id] = new TimerWorkLogEntry(issue.id);
            }

            storage[issue.id].start();
            this.persist().resetBadge();
          },

          /**
           * Ends timer for the current issue
           * @param {object} issue
           */
          stop: function (issue) {
            if (!this.canBeStopped(issue)) { return; }

            const duration = moment.duration(storage[issue.id].duration);

            // less than 60s (fast-click?), see #168
            if (duration.asSeconds() < 60) { return; }

            this.persist().resetBadge(); // transaction

            storage[issue.id].stop();

            // data set for the work-log request
            const dataSet = {
              _method: 'POST',
              comment: duration.humanize(),
              timeSpent: _.round(duration.asMinutes()) + 'm'
            };

            api.issueWorklog(issue.id, dataSet, err => {
              if (err) {
                return storage[issue.id].resume(); // rollback if error
              }

              delete storage[issue.id];
              this.persist().resetBadge();
              $rootScope.$broadcast('tileModified', issue);
            });
          },

          /**
           * Stops timer without time-logging
           * @param {object} issue
           */
          discard: function (issue) {
            if (!this.canBeStopped(issue)) { return; }
            delete storage[issue.id];
            this.persist().resetBadge();
          }
        };
      }
    };
  }]);
