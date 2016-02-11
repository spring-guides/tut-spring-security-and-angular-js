angular.module('navigation', ['ngRoute', 'auth']).controller(
		'navigation',

		function($route, auth) {
			
			var self = this;

			self.credentials = {};
			
			self.tab = function(route) {
				return $route.current && route === $route.current.controller;
			};

			self.authenticated = function() {
				return auth.authenticated;
			}

			self.login = function() {
				auth.authenticate(self.credentials, function(authenticated) {
					if (authenticated) {
						console.log("Login succeeded")
						self.error = false;
					} else {
						console.log("Login failed")
						self.error = true;
					}
				})
			};

			self.logout = auth.clear;

		});
