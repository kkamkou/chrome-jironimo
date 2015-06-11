/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0
 */

angular
  .module('jironimo.shared')
  .filter('i18n', function () {
    return chrome.i18n.getMessage;
  });
