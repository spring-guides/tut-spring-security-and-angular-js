angular.module('hello', [ 'ngRoute' ]).config(function($routeProvider) {

	$routeProvider.when('/', {
		templateUrl : 'home.html',
		controller : 'home',
		controllerAs: 'controller'
	}).when('/login', {
		templateUrl : 'login.html',
		controller : 'navigation',
		controllerAs: 'controller'
	}).otherwise('/');

}).controller('navigation',

function($rootScope, $http, $location, $route) {
	
	var self = this;

	self.tab = function(route) {
		return $route.current && route === $route.current.controller;
	};

	var authenticate = function(callback) {

		$http.get('user').then(function(response) {
			if (response.data.name) {
				$rootScope.authenticated = true;
			} else {
				$rootScope.authenticated = false;
			}
			callback && callback();
		}, function() {
			$rootScope.authenticated = false;
			callback && callback();
		});

	}

	authenticate();

	self.credentials = {};
	self.login = function() {
		$http.post('login', $.param(self.credentials), {
			headers : {
				"content-type" : "application/x-www-form-urlencoded"
			}
		}).then(function() {
			authenticate(function() {
				if ($rootScope.authenticated) {
					console.log("Login succeeded")
					$location.path("/");
					self.error = false;
					$rootScope.authenticated = true;
				} else {
					console.log("Login failed with redirect")
					$location.path("/login");
					self.error = true;
					$rootScope.authenticated = false;
				}
			});
		}, function() {
			console.log("Login failed")
			$location.path("/login");
			self.error = true;
			$rootScope.authenticated = false;
		})
	};

	self.logout = function() {
		$http.post('logout', {}).finally(function() {
			$rootScope.authenticated = false;
			$location.path("/");
		});
	}

}).controller('home', function($http) {
	var self = this;
	$http.get('http://localhost:9000').then(function(response) {
		self.greeting = response.data;
	})
});
