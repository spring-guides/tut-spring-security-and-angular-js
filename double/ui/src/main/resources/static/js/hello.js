angular.module('hello', []).controller('home',

function($scope, $http) {
	
	console.log('Loading')

	$http.get('user').success(function(data) {
		if (data.name) {
			$scope.authenticated = true;
			$scope.user = data.name
			$http.get('/resource/').success(function(data) {
				$scope.greeting = data;
			})
		} else {
			$scope.authenticated = false;
		}
	}).error(function() {
		$scope.authenticated = false;
	});

});
