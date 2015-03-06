angular.module('hello', []).config(function($httpProvider) {

	$httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

}).controller('navigation',

function($scope, $http, $location) {

	var authenticate = function(credentials, callback) {

		var headers = credentials ? {
			authorization : "Basic "
					+ btoa(credentials.username + ":"
							+ credentials.password)
		} : {};

		$http.get('user', {
			headers : headers
		}).success(function(data) {
			if (data.name) {
				$scope.authenticated = true;
			} else {
				$scope.authenticated = false;
			}
			callback && callback();
		}).error(function() {
			$scope.authenticated = false;
			callback && callback();
		});

	}

	authenticate();

	$scope.credentials = {};
	$scope.login = function() {
		authenticate($scope.credentials, function() {
			if ($scope.authenticated) {
				console.log("Login succeeded")
				$location.path("/");
				$scope.error = false;
				$scope.authenticated = true;
			} else {
				console.log("Login failed")
				$location.path("/login");
				$scope.error = true;
				$scope.authenticated = false;
			}
		})
	};

	$scope.logout = function() {
		$http.post('logout', {}).success(function() {
			$scope.authenticated = false;
			$location.path("/");
		}).error(function(data) {
			console.log("Logout failed")
			$scope.authenticated = false;
		});
	}

});
