angular
  .module('jironimo.settings', [])
  .service('cjSettings', function () {
    // defaults
    var _data = localStorage, self = this, defaults = {};

    // default settings for the colors tab
    defaults.colors = {
      theme: 'default',
      priority: {
        1: {fg: 'color-white', bg: 'color-red', bd: 'color-white', ot: 'color-red'},
        2: {fg: 'color-white', bg: 'color-orangeDark', bd: 'color-white', ot: 'color-orangeDark'},
        3: {fg: 'color-white', bg: 'color-orange', bd: 'color-white', ot: 'color-orange'},
        4: {fg: 'color-white', bg: 'color-grayDark', bd: 'color-white', ot: 'color-grayDark'},
        5: {fg: 'color-darken', bg: 'color-blueLight', bd: 'color-white', ot: 'color-blueLight'}
      }
    };

    // default settings for the workspaces tab
    defaults.workspaces = [{
      icon: 'home',
      title: 'Default',
      query: 'assignee = currentUser() ORDER BY updatedDate DESC',
      default: true
    }];

    // default settings for the timer tab
    defaults.timer = {workspace: 5};

    // default active timers
    defaults.timers = {};

    // getters and setters override
    angular.forEach(
      ['account', 'colors', 'timer', 'workspaces', 'timers'],
      function (name) {
        self.__defineGetter__(name, function () {
          if (!_data[name] && defaults[name]) {
            _data[name] = angular.toJson(defaults[name]);
          }
          return _data[name] ? angular.fromJson(_data[name]) : null;
        });

        self.__defineSetter__(name, function (val) {
          return _data[name] = angular.toJson(val);
        });
      }
    );

    return this;
  });
