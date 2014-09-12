var angular = require('angular');

angular.module('hello', []).controller('Hello', function($scope, $http) {

	$http.get('http://localhost:8080/token').then(function(token) {
		
		return $http({
			method : 'GET',
			url : 'http://localhost:9000',
			headers : {'X-Token' : token.data}
		});

	}).then(function(result) {
		$scope.greeting = result.data;
	}).catch(function(e) {
		console.log(JSON.stringify(e));
	});

});

angular.bootstrap(document, ['hello']);
