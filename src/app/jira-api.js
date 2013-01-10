function JiraApi() {
  this.search = function (query, callback) {
    this._makeRequest('search', {jql: query}, callback);
  };

  this._makeRequest = function (urn, data, callback) {
    // $http({
    //   url: 'http://jira.bloopark.com/rest/api/latest/' + urn,
    //   method: method || 'GET',
    //   data: data
    // }).success(function(data, status, headers, config) {
    //   $scope.data = data;
    // }).error(function(data, status, headers, config) {
    //   $scope.status = status;
    // });
    $.getJSON('http://jira.bloopark.com/rest/api/latest/' + urn, data)
      .done(function (json) {
        return callback(null, json);
      })
      .error(function (error) {
        return callback(error);
      });
  };
};

jironimo.factory('jrApi', function () {
  return new JiraApi();
});
