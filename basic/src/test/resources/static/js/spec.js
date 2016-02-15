describe("App", function() {

	beforeEach(module('hello'));
	var $httpBackend, $controller;
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		$controller = $injector.get('$controller');
	}));
	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it("says Hello Test when controller loads", function() {
		$httpBackend.expectGET('resource/').respond(200, {
			id : 4321,
			content : 'Hello Test'
		});
		var controller = $controller('home');
		$httpBackend.flush();
		expect(controller.greeting.content).toEqual('Hello Test');
	});

})
