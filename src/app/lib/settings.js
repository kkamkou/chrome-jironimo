/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

'use strict';

angular
  .module('jironimo.settings', [])
  .service('cjSettings', ['$filter', function ($filter) {
    var _data = localStorage, self = this, defaults = {};

    defaults.version = 600;

    // default settings for the account tab
    defaults.general = {sync: true};

    defaults.accounts = [
      {enabled: false, id: 'default', label: 'Default', timeout: 10, type: 'basic', url: null}
    ];

    // default settings for the colors tab
    defaults.colors = {
      theme: 'default',
      sizes: {
        epic: 'triple',
        story: 'double',
        task: 'default',
        'sub-task': 'default',
        bug: 'default',
        improvement: 'default'
      },
      priority: {
        1: {fg: 'white', bg: 'red', bd: 'white', ot: 'red'},
        2: {fg: 'white', bg: 'orange', bd: 'white', ot: 'orange'},
        3: {fg: 'white', bg: 'lightOlive', bd: 'white', ot: 'lightOlive'},
        4: {fg: 'white', bg: 'gray', bd: 'white', ot: 'gray'},
        5: {fg: 'white', bg: 'cyan', bd: 'white', ot: 'lightBlue'},
        6: {fg: 'white', bg: 'lightBlue', bd: 'white', ot: 'lightBlue'}
      }
    };

    // default settings for the workspaces tab
    defaults.workspaces = [
      {
        account: 'ALL',
        icon: 'target',
        title: $filter('i18n')('settingsWorkspaceMyIssues'),
        query: 'assignee = currentUser() AND status not in (Closed, Resolved)' +
          ' ORDER BY updatedDate DESC',
        changesNotify: true
      },
      {
        account: 'ALL',
        icon: 'share-2',
        title: $filter('i18n')('settingsWorkspaceCreatedByMe'),
        query: 'reporter = currentUser() ORDER BY created DESC',
        changesNotify: true
      },
      {
        account: 'ALL',
        icon: 'eye-2',
        title: $filter('i18n')('settingsWorkspaceWatching'),
        query: '(' +
          'assignee = currentUser() OR assignee was currentUser() OR reporter = currentUser()' +
          ') AND status not in (Closed, Resolved) ORDER BY updated DESC',
        changesNotify: true
      }
    ];

    // default settings for the timer tab
    defaults.timer = {
      enabled: true,
      workspace: 5,
      singleton: true
    };

    defaults.activity = {
      lastAccount: 0,
      workspace: {'default': {index: 0, searchMaxResults: 16, timers: {}}}
    };

    // getters and setters override
    angular.forEach(
      /*jshint camelcase: false */
      Object.keys(defaults), function (name) {
        self.__defineGetter__(name, function () {
          if (!_data[name] && defaults[name]) {
            _data[name] = angular.toJson(defaults[name]);
          }
          return _data[name] ? angular.fromJson(_data[name]) : null;
        });

        self.__defineSetter__(name, function (val) {
          _data[name] = angular.toJson(val);

          // chrome storage update
          var obj = {};
          obj[name] = _data[name];
          chrome.storage.sync.set(obj);
        });
      }
      /*jshint camelcase: true */
    );

    this.getUriSettings = function () {
      return 'views/default.html#/settings/general';
    };

    this.getUriFeedback = function () {
      return 'https://docs.google.com/forms/d/17O-B8lTvqvsLIgsLrUJjOJ_1arlDFkPYZ4UAuFv7zDo' +
        '/viewform?usp=send_form';
    };

    // returns data as an object
    this.getStorageData = function () {
      return _.assign({}, _data);
    };

    // updates the settings object
    this.setStorageData = function (items) {
      _.keys(items).forEach(function (key) {
        _data[key] = items[key];
      });
      return this;
    };

    if (this.version < 600) {
      if (Array.isArray(this.workspaces)) {
        this.workspaces = this.workspaces.map(w => {w.account = 'ALL'; return w;});
      }
      this.accounts = [_.merge(defaults.accounts[0], {enabled: true})];
      this.activity = _.set(this.activity, 'workspace.default', {
        enabled: true,
        index: _data.workspaceLast || 0,
        timers: angular.fromJson(_data.timers)
      });

      const account = angular.fromJson(_data.account);
      if (account && account.url) {
        this.general = {sync: !!account.sync || true};
        this.accounts = [
          _.merge(this.accounts[0], {url: account.url, timeout: account.timeout || 10})
        ];
      }

      delete _data.workspaceLast;
      delete _data.timers;
      delete _data.account;
      this.version = 600;
    }

    return this;
  }]);
