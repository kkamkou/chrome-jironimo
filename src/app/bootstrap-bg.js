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
      chrome.notifications.onClicked.addListener(function (tid) {
        cjNotifications.clear(tid, function (err, id) {
          if (err) { return; }

          if (id === 'jironimo-update') {
            chrome.tabs.create({active: true, url: 'http://2ka.by/article/chrome-jironimo'});
            return;
          }

          chrome.tabs.create({active: true, url: cjSettings.account.url + '/browse/' + id});
        });
      });

      // alarms.onAlarm
      chrome.alarms.onAlarm.addListener(function (alarm) {
        if (!alarm || alarm.name !== 'jironimoStatusCheck') {
          return;
        }

        cjJira.myself(function (err1, info) {
          if (err1) { return; }

          var cache = [];

          _.where(cjSettings.workspaces, {changesNotify: true}).forEach(function (workspace) {
            var query = {
              jql: 'updated > "-%dm" AND '.replace('%d', +cjSettings.timer.workspace) +
                workspace.query,
              expand: 'changelog',
              fields: 'updated,summary'
            };

            cjJira.search(query, function (err2, result) {
              if (err2) { return; }

              _.forEach(result.issues, function (issue) {
                if (cache.indexOf(issue.id) !== -1) {
                  return;
                }

                cache.push(issue.id);

                if (_.get(issue, 'changelog.histories')) {
                  if (_.get(_.last(issue.changelog.histories), 'author.name') === info.name) {
                    return;
                  }
                }

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
          });
        });
      });

      // alarms.onAlarm
      chrome.alarms.onAlarm.addListener(function (alarm) {
        if (!alarm || alarm.name !== 'jironimoRefreshIcon') {
          return;
        }

        var timer = _.where(cjSettings.timers || {}, {started: true}).pop();
        if (!timer) {
          return;
        }

        var diff = moment().diff(moment.unix(timer.timestamp + 3600));
        chrome.browserAction.setBadgeText({text: moment(diff).format('HH:mm')});
      });

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
