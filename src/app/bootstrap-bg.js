/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

angular
  .module('jironimo', ['jironimo.settings', 'jironimo.jira', 'jironimo.notifications'])
  .run(
    function (cjSettings, cjJira, cjNotifications) {
      chrome.alarms.get('jironimoRefreshIcon', function (alarm) {
        if (!alarm) {
          chrome.alarms.create('jironimoRefreshIcon', {periodInMinutes: 1});
        }
      });

      chrome.alarms.get('jironimoStatusCheck', function (alarm) {
        if (!alarm) {
          chrome.alarms.create(
            'jironimoStatusCheck',
            {periodInMinutes: +cjSettings.timer.workspace}
          );
        }
      });

      // notifications.onClicked
      chrome.notifications.onClicked.addListener(function (id) {
        cjNotifications.clear(id, function (err, id) {
          if (err) { return; }

          if (id === 'jironimo-update') {
            chrome.tabs.create({active: true, url: 'http://2ka.by/article/chrome-jironimo'});
            return;
          }

          chrome.tabs.create({active: true, url: cjSettings.account.url + '/browse/' + id});
        });
      });

      // alarms.onAlarm
      chrome.alarms.onAlarm.addListener(
        function (alarm) {
          if (!alarm || alarm.name !== 'jironimoStatusCheck') {
            return;
          }

          var cache = [];

          _.where(cjSettings.workspaces, {changesNotify: true}).forEach(
            function (workspace) {
              var query = 'updated > "-%dm" AND '.replace('%d', cjSettings.timer.workspace + 1) +
                workspace.query;

              cjJira.search({jql: query}, function (err, result) {
                if (err) { return; }

                _.forEach(result.issues, function (issue) {
                  if (cache[issue.id]) {
                    return;
                  }

                  cache[issue.id] = true;

                  var params = {
                    title: issue.key,
                    isClickable: true,
                    eventTime: moment(issue.fields.updated).valueOf(),
                    message: issue.fields.summary + ' (updated at ' +
                      moment(issue.fields.updated).format('LT') + ')'
                  };

                  cjNotifications.createOrUpdate(issue.key, params);
                });
              });
            }
          );
        }
      );

      // alarms.onAlarm
      chrome.alarms.onAlarm.addListener(
        function (alarm) {
          if (!alarm || alarm.name !== 'jironimoRefreshIcon') {
            return;
          }

          var timer = _.where(cjSettings.timers || {}, {started: true}).pop();
          if (!timer) {
            return;
          }

          var diff = moment().diff(moment.unix(timer.timestamp + 3600));
          chrome.browserAction.setBadgeText({text: moment(diff).format('HH:mm')});
        }
      );

      // runtime.onInstalled
      chrome.runtime.onInstalled.addListener(function (details) {
        switch (details.reason) {
          case 'install':
            chrome.tabs.create({active: true, url: cjSettings.getOptionsPageUri()});
            break;

          case 'update':
            cjNotifications.createOrUpdate('jironimo-update', {
              title: 'Jironimo updated!',
              message: 'The extension has been updated, please check the settings page!'
            });
            break;
        }
      });
    }
  );

angular.bootstrap(document, ['jironimo']);
