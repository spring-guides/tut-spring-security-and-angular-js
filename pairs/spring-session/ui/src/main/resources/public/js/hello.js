angular.module('hello', [ 'ngRoute' ]).config(function($routeProvider) {

	$routeProvider.when('/', {
		templateUrl : 'home.html',
		controller : 'home'
	}).when('/login', {
		templateUrl : 'login.html',
		controller : 'navigation'
	}).otherwise('/');

}).controller('navigation',

function($rootScope, $scope, $http, $location, $route) {

	$scope.tab = function(route) {
		return $route.current && route === $route.current.controller;
	};

	var authenticate = function(callback) {

		$http.get('user').success(function(data) {
			if (data.name) {
				$rootScope.authenticated = true;
			} else {
				$rootScope.authenticated = false;
			}
			callback && callback();
		}).error(function() {
			$rootScope.authenticated = false;
			callback && callback();
		});

	}

	authenticate();

	$scope.credentials = {};
	$scope.login = function() {
		$http.post('login', $.param($scope.credentials), {
			headers : {
				"content-type" : "application/x-www-form-urlencoded"
			}
		}).success(function(data) {
			authenticate(function() {
				if ($rootScope.authenticated) {
					console.log("Login succeeded")
					$location.path("/");
					$scope.error = true;
					$rootScope.authenticated = true;
				} else {
					console.log("Login failed with redirect")
					$location.path("/login");
					$scope.error = true;
					$rootScope.authenticated = false;
				}
			});
		}).error(function(data) {
			console.log("Login failed")
			$location.path("/login");
			$scope.error = true;
			$rootScope.authenticated = false;
		})
	};

	$scope.logout = function() {
		$http.post('logout', {}).success(function() {
			$rootScope.authenticated = false;
			$location.path("/");
		}).error(function(data) {
			console.log("Logout failed")
			$rootScope.authenticated = false;
		});
	}

}).controller('home', function($scope, $http) {
	$http.get('token').success(function(token) {
		$http({
			url : 'http://localhost:9000',
			method : 'GET',
			headers : {
				'X-Session' : token.token
			}
		}).success(function(data) {
			$scope.greeting = data;
		});
	})
});
