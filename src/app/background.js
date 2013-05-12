/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */

chrome.alarms.onAlarm.addListener(refreshIcon);

chrome.alarms.create('jironimoRefreshIcon', {periodInMinutes: 5}); // 5 is the minimum, docs have 1
chrome.alarms.get('jironimoRefreshIcon', refreshIcon);

function refreshIcon(alarm) {
  // alarm validation
  if (alarm && alarm.name !== 'jironimoRefreshIcon') {
    return;
  }

  // defaults
  var timers = JSON.parse(localStorage.timers || '{}'),
      timersKeys = Object.keys(timers);

  // no timers at all
  if (!timersKeys.length) {
    return;
  }

  // filtering according the started state
  timersKeys = timersKeys.filter(function (issueId) {
    return timers[issueId].started;
  });

  // no active timers
  if (!timersKeys.length) {
    return;
  }

  // time difference calculation
  var diff = parseInt(Date.now() / 1000, 10) - timers[timersKeys.pop()].timestamp,
    minutes = parseInt(diff % 3600 / 60, 10).toString(),
    hours = parseInt(diff / 3600, 10).toString();

  // custom format
  if (minutes.length < 2) {
    minutes = '0' + minutes;
  }

  if (hours.length < 2) {
    hours = '0' + hours;
  }

  // badge update
  chrome.browserAction.setBadgeText({text: hours + ':' + minutes});
}
