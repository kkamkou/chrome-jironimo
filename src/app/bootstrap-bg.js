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
      function accountList() {
        return new Promise((resolve, reject) => {
          Promise
            .all(
              cjSettings.accounts
                .filter(a => a.enabled)
                .map(account =>
                  new Promise(resolve => {
                    const api = new Jira(new Request($http), account.url, account.timeout * 1000);
                    api.myself((err, myself) => resolve({
                      problem: _.get(err, 'code') === 401 || (myself && !myself.active),
                      account, api, myself
                    }));
                  })
                )
            )
            .then(entries => {
              const accountList = [];
              entries.forEach(entry => {
                if (!entry.problem) {
                  accountList.push(entry);
                  return;
                }
                cjNotifications.createOrUpdate(`auth;${entry.account.id}`, {
                  title: 'Unauthorized',
                  isClickable: true,
                  message: `Please, authorize the "${entry.account.label}" account!`,
                  priority: 2,
                  requireInteraction: true,
                  iconUrl: chrome.extension.getURL('icons/contact-128.png'),
                  buttons: [{
                    title: 'Disable account',
                    iconUrl: chrome.extension.getURL('icons/cancel-32.png')
                  }]
                });
              });
              resolve(accountList);
            })
            .catch(reject);
        });
      }

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

        accountList()
          .then(accounts => {
            accounts.forEach(entry => {
              const cache = [];
              cjSettings.workspaces
                .filter(w => ~['ALL', entry.account.id].indexOf(w.account) && w.changesNotify)
                .forEach(workspace => {
                  const query = {
                    jql: 'updated > "-%dm" AND '.replace('%d', +cjSettings.timer.workspace || 5) +
                      workspace.query,
                    expand: 'changelog',
                    fields: 'updated,summary'
                  };

                  entry.api.search(query, (err, result) => {
                    if (err || !result || !Array.isArray(result.issues)) { return; }

                    result.issues.forEach(issue => {
                      if (~cache.indexOf(issue.id)) { return; }
                      cache.push(issue.id);

                      const histories = _.get(issue, 'changelog.histories');
                      if (histories
                        && _.get(_.last(histories), 'author.name') === entry.myself.name) {
                        return;
                      }

                      cjNotifications.createOrUpdate(
                        ['issue', entry.account.id, issue.key].join(';'),
                        {
                          eventTime: moment(issue.fields.updated).valueOf(),
                          isClickable: true,
                          requireInteraction: !!workspace.changesNotifyPersistent,
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
        cjNotifications.clear(nId, err => {
          if (err) { return; }

          switch (nId) {
          case 'jironimo-update':
            chrome.tabs.create({active: true, url: cjSettings.getUriSettings()});
            break;
          default:
            const matches = nId.split(';');
            switch (matches[0]) {
            case 'auth':
              chrome.tabs.create({
                active: true,
                url: cjSettings.accounts.find(a => a.id === matches[1]).url
              });
              break;
            case 'issue':
              const url = cjSettings.accounts.find(a => a.id === matches[1]).url;
              chrome.tabs.create({active: true, url: `${url}/browse/${matches[2]}`});
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
          const matches = nId.split(';');
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

        const activity = _(cjSettings.activity.workspace).flatMap('timers').value(),
          cnt = activity.reduce((c, p) => c + _.size(p), 0);
        if (!cnt || cnt > 1) { return; }

        const entry = _.sample(_(activity).omitBy(_.isEmpty).sample());
        chrome.browserAction.setBadgeText(
          {text: moment(moment().diff(entry.timestamp) - 3600000).format('HH:mm')}
        );
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
