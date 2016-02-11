angular.module('admin', []).controller('home',

function($http) {

	var self = this;

	var computeDefaultTemplate = function(user) {
		self.template = user && user.roles && user.roles.indexOf("ROLE_WRITER")>0 ? "write.html" : "read.html";		
	}

	$http.get('user').success(function(data) {
		if (data.name) {
			self.authenticated = true;
			self.user = data;
			computeDefaultTemplate(data);
			$http.get('/resource/').success(function(data) {
				self.greeting = data;
			})			
		} else {
			self.authenticated = false;
		}
		self.error = null
	}).error(function(response) {
		if (response.status === 0) {
			self.error = 'No connection. Verify application is running.';
		} else if (response.status == 401) {
			self.error = 'Unauthorized.';
		} else if (response.status == 403) {
			self.error = 'Forbidden.';
		} else {
			self.error = 'Unknown.';			
		}
		self.authenticated = false;
	});

	self.update = function() {
		$http.post('/resource/', {content: self.greeting.content}).success(function(data) {
			self.greeting = data;
		})
	}

	self.home = function() {
		computeDefaultTemplate(self.user);
	}
	
	self.changes = function() {
		self.template = "changes.html";
		$http.get('/resource/changes').success(function(data) {
			self.data = data;
		})
	}
	
});
