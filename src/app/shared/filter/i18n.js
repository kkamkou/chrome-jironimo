angular
  .module('jironimo.shared')
  .filter(
    'i18n',
    function () {
      return function (id, substitutions) {
        return chrome.i18n.getMessage(id, substitutions);
      };
    }
  );
