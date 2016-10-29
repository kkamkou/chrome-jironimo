/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @link http://github.com/kkamkou/chrome-jironimo
 * @license http://opensource.org/licenses/BSL-1.0
 */

'use strict';

window.onerror = function (err) {
  if (JSON.parse(localStorage.general || '{}').submitExceptions) {
    (new Image()).src = 'http://2ka.by/examples/chrome-jironimo.php?err=' + JSON.stringify(err);
  }
};
