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
    defaults.account = {timeout: 10};

    // default settings for the colors tab
    defaults.colors = {
      theme: 'default',
      sizes: {
        epic: 'triple',
        story: 'double',
        'sub-task': 'default',
        bug: 'default',
        improvement: 'default'
      },
      priority: {
        1: {fg: 'white', bg: 'red', bd: 'white', ot: 'red'},
        2: {fg: 'white', bg: 'orangeDark', bd: 'white', ot: 'orangeDark'},
        3: {fg: 'white', bg: 'orange', bd: 'white', ot: 'orange'},
        4: {fg: 'white', bg: 'grayDark', bd: 'white', ot: 'grayDark'},
        5: {fg: 'darken', bg: 'blueLight', bd: 'white', ot: 'blueLight'}
      }
    };

    // default settings for the workspaces tab
    defaults.workspaces = [
      {
        icon: 'target',
        title: 'My issues',
        query: 'assignee = currentUser() ORDER BY updatedDate DESC',
        isDefault: true
      },
      {
        icon: 'share-2',
        title: 'Created by me',
        query: 'reporter = currentUser() ORDER BY created DESC',
        isDefault: false
      }
    ];

    // default settings for the timer tab
    defaults.timer = {
      workspace: 5,
      singleton: true
    };

    // default active timers
    defaults.timers = {};

    // getters and setters override
    angular.forEach(
      Object.keys(defaults), function (name) {
        self.__defineGetter__(name, function () {
          if (!_data[name] && defaults[name]) {
            _data[name] = angular.toJson(defaults[name]);
          }
          return _data[name] ? angular.fromJson(_data[name]) : null;
        });

        self.__defineSetter__(name, function (val) {
          _data[name] = angular.toJson(val);
        });
      }
    );

    return this;
  });
