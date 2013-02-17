/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 * @version 1.0
 */
angular
  .module('jironimo.timer', ['jironimo.jira', 'jironimo.settings'])
  .factory('cjTimer', function (cjJira, cjSettings) {
    // defaults
    var timerSet = cjSettings.timers,
      updateTimer = function (issueId, fields) {
        var defaultFields = {started: true, timestamp: null};

        if (!timerSet[issueId]) {
          timerSet[issueId] = defaultFields;
        }

        Object.keys(fields).forEach(function (field) {
          timerSet[issueId][field] = fields[field];
        });

        cjSettings.timers = timerSet;
      };

    // exports
    return {
      /**
       * Returns true if timer for this issue already started
       *
       * @param {object} issue
       * @return {Boolean}
       */
      isStarted: function (issue) {
        return (timerSet[issue.id] && timerSet[issue.id].started);
      },

      /**
       * Returns true if timer for this issue can be started
       *
       * @param {object} issue
       * @return {Boolean}
       */
      canBeStarted: function (issue) {
        // default flag
        var flag = !this.isStarted(issue) &&
          issue.fields.status.name !== 'Closed'; // @todo! not trusted

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
       * @param {object} issue
       * @return {Boolean}
       */
      canBeStopped: function (issue) {
        return this.isStarted(issue);
      },

      /**
       * Returns elapsed time for the current issue (humanized)
       *
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
       * @param {object} issue
       */
      start: function (issue) {
        updateTimer(issue.id, {started: true, timestamp: moment().unix()});
      },

      /**
       * Ends timer for the current issue
       *
       * @param {object} issue
       */
      stop: function (issue) {
        // stop check
        if (!this.canBeStopped(issue)) {
          return false;
        }

        // time diff
        var issueTimestamp = timerSet[issue.id].timestamp,
          diff = parseInt(moment().unix() - issueTimestamp, 10);

        // diff is zero (fastclick?)
        if (!diff) {
          return false;
        }

        // data set for the worklog request
        var dataSet = {
          _method: 'post',
          comment: moment.duration(diff * 1000).humanize(),
          timeSpent: (diff > 60 ? Math.ceil(diff / 60) : 1) + 'm'
        };

        // updating the entry
        updateTimer(issue.id, {started: false, timestamp: null});

        // sending request
        cjJira.worklog(issue.id, dataSet, function (err) {
          // rollback if error
          if (err) {
            updateTimer(issue.id, {started: true, timestamp: issueTimestamp});
          }
        });
      }
    };
  });
