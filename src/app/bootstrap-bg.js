/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */

angular
  .module('jironimo', ['jironimo.settings', 'jironimo.jira', 'jironimo.notifications'])
  .config(function () {
    // chrome.alarms.create('jironimoRefreshIcon', {periodInMinutes: 1});
    chrome.alarms.create('jironimoStatusCheck', {periodInMinutes: 1});
  })
  .run(
    function (cjSettings, cjJira, cjNotifications) {
      chrome.notifications.onClicked.addListener(function (id) {
        cjNotifications.clear(id, function (err, id) {
          if (err) { return; }
          chrome.tabs.create({active: false, url: cjSettings.account.url + '/browse/' + id});
        });
      });

      chrome.alarms.onAlarm.addListener(
        function (alarm) {
          // alarm validation
          if (!alarm || alarm.name !== 'jironimoStatusCheck') {
            return;
          }

          var cache = [];

          _.pluck(cjSettings.workspaces, 'query').forEach(
            function (query) {
              query = 'updated > "-%dm" AND '.replace('%d', cjSettings.timer.workspace) + query;
              cjJira.search(query, function (err, result) {
                if (err) {
                  return;
                }

                _.forEach(result.issues, function (issue) {
                  if (cache[issue.id]) {
                    return;
                  }

                  cache[issue.id] = true;

                  var params = {
                    title: issue.key,
                    eventTime: moment(issue.fields.updated).valueOf(),
                    isClickable: true,
                    message: 'Updated at ' + moment(issue.fields.updated).format('LT')
                  };

                  cjNotifications.createOrUpdate(issue.key, params, function (err, id) {
                    console.log(err, id);
                  });
                });
              });
            }
          );
        }
      );

    }
  );

angular.bootstrap(document, ['jironimo']);
