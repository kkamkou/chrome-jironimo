function CjSettings() {
  var self = this,
    defaults = {
      colors: {
        theme: 'default',
        priority: {
          1: {fg: 'color-white', bg: 'color-red', bd: 'color-white', ot: 'color-red'},
          2: {fg: 'color-white', bg: 'color-orangeDark', bd: 'color-white', ot: 'color-orangeDark'},
          3: {fg: 'color-white', bg: 'color-orange', bd: 'color-white', ot: 'color-orange'},
          4: {fg: 'color-white', bg: 'color-grayDark', bd: 'color-white', ot: 'color-grayDark'},
          5: {fg: 'color-darken', bg: 'color-blueLight', bd: 'color-white', ot: 'color-blueLight'}
        }
      },
      workspaces: [{
        icon: 'home',
        title: 'Default',
        query: 'assignee = currentUser() ORDER BY updatedDate DESC',
        default: true
      }],
      timer: {
        workspace: 5
      }
    };

  this._data = localStorage;

  angular.forEach(['account', 'colors', 'timer', 'workspaces'], function (name) {
    self.__defineGetter__(name, function () {
      if (!self._data[name] && defaults[name]) {
        self._data[name] = angular.toJson(defaults[name]);
      }
      return self._data[name] ? angular.fromJson(self._data[name]) : null;
    });

    self.__defineSetter__(name, function (val) {
      return self._data[name] = angular.toJson(val);
    });
  });
}
