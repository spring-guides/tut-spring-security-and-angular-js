angular.module('hello', []).controller('home',

function($http) {
	
	var self = this;
	
	console.log('Loading');

	$http.get('user').success(function(data) {
		if (data.name) {
			self.authenticated = true;
			self.user = data.name
			$http.get('/resource/').success(function(data) {
				self.greeting = data;
			})
		} else {
			self.authenticated = false;
		}
	}).error(function() {
		self.authenticated = false;
	});

});
