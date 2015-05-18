/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

angular
  .module('jironimo.notifications', [])
  .service('cjNotifications', function () {
    var notifications = [],
      optionsDefault = {
        type: 'basic',
        iconUrl: chrome.extension.getURL('icons/128.png')
      };

    this.createOrUpdate = function (id, params, cb) {
      return this[notifications[id] ? 'update': 'create'](id, params, cb || function () {});
    };

    this.clear = function (id, cb) {
      chrome.notifications.clear(id, function (wasCleared) {
        var err = wasCleared ? null : true;
        if (!err) {
          delete notifications[id];
        }
        cb(err, id);
      });
    };

    this.create = function (id, params, cb) {
      var options = _.defaults({}, optionsDefault, params);
      chrome.notifications.create(id, options, function (notificationId) {
        var err = notificationId ? null : true;
        if (!err) {
          notifications[id] = true;
        }

        cb(err, notificationId);
      });
    };

    this.update = function (id, params, cb) {
      chrome.notifications.update(id, params, function (wasUpdated) {
        cb(wasUpdated ? null : true, id);
      });
    };

    /*
      var enabled = true;

      chrome.notifications.getPermissionLevel(function (lvl) {
        enabled = (lvl === 'granted');
      });

      this.isEnabled = function () {
        return enabled;
      };
    */

    return this;
  });
