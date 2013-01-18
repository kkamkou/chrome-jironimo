// default settings for the colors section
if (!localStorage.colors) {
  localStorage.colors = angular.toJson({theme: 'default'});
}

// default settings for the workspaces section
if (!localStorage.workspaces) {
  localStorage.workspaces = angular.toJson([{
    icon: 'home',
    title: 'Default',
    query: 'assignee = currentUser() ORDER BY updatedDate DESC',
    default: true
  }]);
}

function CjSettings() {
  var self = this;

  this._data = localStorage;

  angular.forEach(['account', 'colors', 'timer', 'workspaces'], function(name) {
    self.__defineGetter__(name, function() {
      return self._data[name] ? angular.fromJson(self._data[name]) : null;
    });

    self.__defineSetter__(name, function(val) {
      return self._data[name] = angular.toJson(val);
    });
  });
}
