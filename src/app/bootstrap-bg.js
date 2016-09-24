/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

angular
  .module('jironimo', ['jironimo.settings', 'jironimo.notifications', 'jironimo.shared'])
  .run([
    '$http', 'cjSettings', 'cjNotifications', '$filter',
    function ($http, cjSettings, cjNotifications, $filter) {

      const accountList = [];
      cjSettings.accounts.filter(a => a.enabled).forEach(account => {
        const api = new Jira(new Request($http), account.url, account.timeout * 1000);
        api.authenticated((err, flag) => {
          if (flag) {
            accountList.push({account: account, api: api});
            return;
          }

          cjNotifications.createOrUpdate(`auth-${account.id}`, {
            title: 'Unauthorized',
            isClickable: true,
            message: `Please, authorize the "${account.label}" account!`,
            priority: 2,
            requireInteraction: true,
            iconUrl: chrome.extension.getURL('icons/contact-128.png'),
            buttons: [{
              title: 'Disable account',
              iconUrl: chrome.extension.getURL('icons/cancel-32.png')
            }]
          });
        });
      });

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

      // alarms.onAlarm
      chrome.alarms.onAlarm.addListener(function (alarm) {
        if (!alarm || alarm.name !== 'jironimoStatusCheck') { return; }

        accountList.forEach(entry => {
          entry.api.myself((err, info) => {
            if (err) { return; }

            const cache = [];

            _.filter(cjSettings.workspaces, {account: entry.account.id, changesNotify: true})
              .forEach(workspace => {
                const query = {
                  jql: 'updated > "-%dm" AND '.replace('%d', +cjSettings.timer.workspace) +
                  workspace.query,
                  expand: 'changelog',
                  fields: 'updated,summary'
                };

                entry.api.search(query, (err, result) => {
                  if (err || !result || !Array.isArray(result.issues)) { return; }

                  result.issues.forEach(issue => {
                    if (~cache.indexOf(issue.id)) { return; }
                    cache.push(issue.id);

                    if (_.get(issue, 'changelog.histories')
                        && _.get(_.last(issue.changelog.histories), 'author.name') === info.name) {
                      return;
                    }

                    cjNotifications.createOrUpdate(
                      ['issue', entry.account.id, issue.key].join('-'),
                      {
                        eventTime: moment(issue.fields.updated).valueOf(),
                        isClickable: true,
                        message: issue.fields.summary.trim() +
                        ' (updated at ' + moment(issue.fields.updated).format('LT') + ')',
                        title: issue.key
                      }
                    );
                  });
                });
              });
          });
        });
      });

      // notifications.onClicked
      chrome.notifications.onClicked.addListener(nId => {
        cjNotifications.clear(nId, (err, id) => {
          if (err) { return; }

          switch (nId) {
            case 'jironimo-update':
              chrome.tabs.create({active: true, url: cjSettings.getUriSettings()});
              break;
            default:
              const matches = nId.split('-');
              switch (matches[0]) {
                case 'auth':
                  chrome.tabs.create({
                    active: true,
                    url: cjSettings.accounts.find(a => a.id === matches[1]).url
                  });
                  break;

                case 'issue':
                  const url = cjSettings.accounts.find(a => a.id === matches[1]).url;
                  chrome.tabs.create({active: true, url: `${url}/browse/${id}`});
                  break;

                default:
                  console.error('Unknown subtype');
              }
          }
        });
      });

      chrome.notifications.onButtonClicked.addListener((nId, btnIdx) => {
        switch (nId) {
          case 'jironimo-update':
            chrome.tabs
              .create({active: true, url: 'http://2ka.by/article/chrome-jironimo#changelog'});
            break;
          default:
            const matches = nId.split('-');
            switch (matches[0]) {
              case 'auth':
                cjSettings.accounts = cjSettings.accounts.map(a => {
                  if (a.id === matches[1]) { a.enabled = false; }
                  return a;
                });
                cjNotifications.clear(nId);
                break;
            }
        }
      });

      // alarms.onAlarm
      chrome.alarms.onAlarm.addListener(function (alarm) {
        if (!alarm || alarm.name !== 'jironimoRefreshIcon') { return; }

        const timer = _.filter(cjSettings.timers || {}, {started: true}).pop();
        if (!timer) { return; }

        const diff = moment().diff(moment.unix(timer.timestamp + 3600));
        chrome.browserAction.setBadgeText({text: moment(diff).format('HH:mm')});
      });

      // runtime.onInstalled
      chrome.runtime.onInstalled.addListener(function (details) {
        switch (details.reason) {
          case 'install':
            chrome.tabs.create({active: true, url: cjSettings.getUriSettings()});
            chrome.runtime.setUninstallURL(cjSettings.getUriFeedback());
            break;

          case 'update':
            cjNotifications.createOrUpdate('jironimo-update', {
              buttons: [{
                title: 'Changelog',
                iconUrl: chrome.extension.getURL('icons/eye-32.png')
              }],
              title: $filter('i18n')('messageJironimoUpdatedTitle'),
              message: $filter('i18n')('messageJironimoUpdatedText')
            });
            break;
        }
      });
    }
  ]);

angular.bootstrap(document, ['jironimo'], {strictDi: true});
