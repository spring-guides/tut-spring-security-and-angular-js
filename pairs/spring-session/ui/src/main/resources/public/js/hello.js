function Hello($scope, $http) {
	var headers = {
		'X-Token' : token // Yikes! Global variable.
	};
	$http({
		method : 'GET',
		url : 'http://localhost:9000',
		headers : headers
	}).success(function(data) {
		$scope.greeting = data;
	})
};
