angular.module('message', []).controller('message', function($scope, $http) {
	$http.get('/resource/').success(function(data) {
		$scope.greeting = data;
	});
});
