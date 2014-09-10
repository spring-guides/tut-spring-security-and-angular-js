function Hello($scope, $http) {
    $http.get('http://localhost:9000').
        success(function(data) {
            $scope.greeting = data;
        });
}
