angular.module('message', []).controller('message', function($http) {
	var self = this;
	$http.get('/resource/').success(function(data) {
		self.greeting = data;
	});
});
