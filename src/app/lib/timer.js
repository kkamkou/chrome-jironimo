angular
  .module('jironimo.timer', ['jironimo.settings'])
  .factory('cjTimer', function (cjSettings) {
    var timerSet = cjSettings.timers,
      updateTimers = function (newSet) {
        cjSettings.timers = newSet;
      };

    return {
      isStarted: function (issue) {
        return (timerSet[issue.id] && timerSet[issue.id].started);
      },

      canBeStarted: function (issue) {
        return !this.isStarted(issue);
      },

      canBeStopped: function (issue) {
        return this.isStarted(issue);
      },

      start: function (issue) {
        timerSet[issue.id] = {
          started: true,
          timestamp: Date.now()
        };

        updateTimers(timerSet);
      },

      stop: function (issue) {
        timerSet[issue.id].started = false;
        updateTimers(timerSet);
      }
    };
  });
