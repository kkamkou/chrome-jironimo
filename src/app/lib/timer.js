/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

angular
  .module('jironimo.timer', ['jironimo.jira', 'jironimo.settings'])
  .factory('cjTimer', ['cjJira', 'cjSettings', function (cjJira, cjSettings) {
    var self = this,
      timerSet = cjSettings.timers;

    return {
      /**
       * Updates a timer entry for the issue
       *
       * @public
       * @param {object} issue
       * @param {object} fields
       */
      update: function (issue, fields) {
        if (!timerSet[issue.id]) {
          timerSet[issue.id] = {started: false, timestamp: null};
        }

        Object.keys(fields).forEach(function (field) {
          timerSet[issue.id][field] = fields[field];
        });

        cjSettings.timers = timerSet;

        this.initIcon(issue);
      },

      /**
       * Returns true if timer for this issue already started
       *
       * @public
       * @param {object} issue
       * @return {Boolean}
       */
      isStarted: function (issue) {
        return (timerSet[issue.id] && timerSet[issue.id].started);
      },

      /**
       * Returns true if timer for this issue can be started
       *
       * @public
       * @param {object} issue
       * @return {Boolean}
       */
      canBeStarted: function (issue) {
        // default flag
        var flag = cjSettings.timer.enabled && !this.isStarted(issue) &&
          _.get(issue, 'fields.status.name') !== 'Closed'; // @todo! not trusted

        // only one active ticket
        if (cjSettings.timer.singleton) {
          flag = flag && !_.find(timerSet, function (entry) {
            return entry.started;
          });
        }
        return flag;
      },

      /**
       * Returns true if timer for this issue can be stopped
       *
       * @public
       * @param {object} issue
       * @return {Boolean}
       */
      canBeStopped: function (issue) {
        return this.isStarted(issue);
      },

      /**
       * Returns elapsed time for the current issue (humanized)
       *
       * @public
       * @param {object} issue
       * @return {String}
       */
      elapsedTime: function (issue) {
        return !this.isStarted(issue) ? '' : moment.duration(
          moment(timerSet[issue.id].timestamp * 1000).diff()
        ).humanize();
      },

      /**
       * Starts timer for the current issue
       *
       * @public
       * @param {object} issue
       */
      start: function (issue) {
        this.update(issue, {started: true, timestamp: moment().unix()});
      },

      /**
       * Ends timer for the current issue
       *
       * @public
       * @param {object} issue
       */
      stop: function (issue) {
        if (!this.canBeStopped(issue)) {
          return;
        }

        var issueTimestamp = timerSet[issue.id].timestamp,
          diff = parseInt(moment().unix() - issueTimestamp, 10);

        // diff is zero (fastclick?)
        if (!diff) {
          return;
        }

        this.update(issue, {started: false, timestamp: null});

        // data set for the worklog request
        var dataSet = {
          _method: 'POST',
          comment: moment.duration(diff * 1000).humanize(),
          timeSpent: (diff > 60 ? Math.ceil(diff / 60) : 1) + 'm'
        };

        cjJira.issueWorklog(issue.id, dataSet, function (err) {
          if (err) { // rollback if error
            self.update(issue, {started: true, timestamp: issueTimestamp});
          }
        });
      },

      /**
       * Stops timer without time-logging
       *
       * @public
       * @param {object} issue
       */
      discard: function (issue) {
        if (this.canBeStopped(issue)) {
          this.update(issue, {started: false, timestamp: null});
        }
      },

      /**
       * Shows a timer stub on the badge for the active issue
       *
       * @private
       * @param {object} issue
       */
      initIcon: function (issue) {
        chrome.browserAction.setBadgeText({
          text: this.isStarted(issue) ? '00:00' : ''
        });
      }
    };
  }]);
