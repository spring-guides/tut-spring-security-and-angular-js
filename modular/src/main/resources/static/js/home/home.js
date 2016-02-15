angular.module('home', []).controller('home', function($http) {
	var self = this;
	$http.get('/user/').success(function(data) {
		self.user = data.name;
	});
});
