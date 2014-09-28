/**
 * chrome-jironimo
 *
 * @author Kanstantsin Kamkou <2ka.by>
 * @{@link http://github.com/kkamkou/chrome-jironimo}
 * @license http://opensource.org/licenses/BSL-1.0 Boost Software License 1.0 (BSL-1.0)
 */

angular
  .module('jironimo', ['jironimo.settings', 'jironimo.jira', 'jironimo.notifications'])
  //.config()
  .run(
    function (cjSettings, cjJira, cjNotifications) {
      _.pluck(cjSettings.workspaces, 'query').forEach(
        function (query) {
          cjJira.search(query, function (err, result) {
            if (err) {
              return;
            }

            _.forEach(result.issues, function (issue) {
              var hash = [issue.id, moment(issue.fields.updated).unix()].join(':');
              //cjNotifications.create(issue.id, issue.key, '');
            });
          });
        }
      );
    }
  );

angular.bootstrap(document, ['jironimo']);
