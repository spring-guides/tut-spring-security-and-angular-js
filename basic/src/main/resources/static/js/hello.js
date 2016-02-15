angular.module('hello', []).controller('home', function($http) {
	var self = this;
	$http.get('resource/').success(function(data) {
		self.greeting = data;
	})
});
