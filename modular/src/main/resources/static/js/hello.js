angular
		.module('hello', [ 'ngRoute', 'auth', 'home', 'message', 'login' ])
		.config(

				function($routeProvider, $httpProvider, $locationProvider) {

					$locationProvider.html5Mode(true);

					$routeProvider.when('/', {
						templateUrl : 'js/home/home.html',
						controller : 'home'
					}).when('/message', {
						templateUrl : 'js/message/message.html',
						controller : 'message'
					}).when('/login', {
						templateUrl : 'js/login/login.html',
						controller : 'login'
					}).otherwise('/');

					$httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

				}).run(function(auth) {

			// Initialize auth module with the home page and login/logout path
			// respectively
			auth.init('/', '/login', '/logout');

		});
