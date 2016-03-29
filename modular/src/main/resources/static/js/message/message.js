angular.module('message', []).controller('message', function($http) {
	var self = this;
	$http.get('/resource/').then(function(response) {
		self.greeting = response.data;
	});
});
