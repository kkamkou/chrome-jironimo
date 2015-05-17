angular
  .module('jironimo.shared')
  .filter(
    'i18n',
    function () {
      return chrome.i18n.getMessage;
    }
  );
