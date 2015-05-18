/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */

angular
  .module('jironimo.settings', [])
  .service('cjSettings', function () {
    // defaults
    var _data = localStorage, self = this, defaults = {};

    // default settings for the account tab
    defaults.account = {timeout: 10, sync: true};

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
        icon: 'target',
        title: 'My issues',
        query: 'assignee = currentUser() ORDER BY updatedDate DESC',
        isDefault: true,
        changesNotify: false
      },
      {
        icon: 'share-2',
        title: 'Created by me',
        query: 'reporter = currentUser() ORDER BY created DESC',
        isDefault: false,
        changesNotify: false
      },
      {
        icon: 'eye-2',
        title: 'Watching',
        query: '(' +
          'assignee = currentUser() OR assignee was currentUser() OR reporter = currentUser()' +
          ') AND status not in (Closed, Resolved) ORDER BY updated DESC',
        isDefault: false,
        changesNotify: true
      }
    ];

    // default settings for the timer tab
    defaults.timer = {
      enabled: true,
      workspace: 5,
      singleton: true
    };

    // defaults for the personal data
    defaults.timers = {};
    defaults.workspaceLast = 0;

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

    this.getOptionsPageUri = function () {
      return 'views/default.html#/settings/account';
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

    // migrations
    if (_data.timer && typeof _data.timer.disabled !== 'undefined') {
      _data.timer.enabled = !_data.timer.disabled;
      delete _data.timer.disabled;
    }

    return this;
  });
