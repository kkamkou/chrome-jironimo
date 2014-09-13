/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */
angular
  .module('jironimo.notifications', [])
  .service('cjNotifications', function () {
    var optionsDefault = {
      type: 'basic',
      iconUrl: chrome.extension.getURL('icons/128.png')
    };

    this.create = function (id, caption, msg, cb) {
      var options = _.defaults({}, optionsDefault, {message: msg, title: caption});
      chrome.notifications.create(id, options, function (ntId) {
        cb(null, ntId);
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
