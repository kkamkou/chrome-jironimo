function IndexController($scope, jrApi) {
  var self = this;

  this.getPriorityColor = function (num) {
    var colorSet = {
      5: {fg: '', bg: ''},
      4: {fg: 'fg-color-white', bg: 'bg-color-darken'},
      3: {fg: 'fg-color-white', bg: 'bg-color-pinkDark'},
      2: {fg: 'fg-color-white', bg: 'bg-color-orangeDark'},
      1: {fg: 'fg-color-white', bg: 'bg-color-red'},
    };
    return colorSet[num];
  };

  this.refreshTickets = function () {
    $scope.issues = [];

    // some initial checks
    if (jrApi.isAuthenticated()) {
      return false;
    };

    jrApi.search('assignee = currentUser() ORDER BY updatedDate DESC', function (err, data) {
      if (err) {
        return false;
      }

      // some corrections
      $.map(data.issues, function (issue) {
        if (issue.fields.description) {
          issue.fields.description = S(issue.fields.description).truncate(70).s;
        }

        issue._colors = self.getPriorityColor(issue.fields.priority.id);

        $scope.issues.push(issue);
      });

      //console.log(data.issues);

      $scope.$apply();
    });

    setTimeout(self.refreshTickets, 20000);
  };

  if (localStorage.account) {
    this.refreshTickets();
  }
}
