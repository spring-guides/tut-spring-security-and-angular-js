var TestBed = ng.core.testing.TestBed;
var inject = ng.core.testing.inject;
var ResponseOptions = ng.http.ResponseOptions;
var Response = ng.http.Response;

ng.core.testing.getTestBed().initTestEnvironment(
    ng.platformBrowserDynamic.testing.BrowserDynamicTestingModule,
    ng.platformBrowserDynamic.testing.platformBrowserDynamicTesting()
  );

describe("AppComponent", function() {

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [ng.http.HttpModule],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: ng.http.XHRBackend, useClass: ng.http.testing.MockBackend }
      ]
    }).compileComponents();
  });

  it('should create the app', function() {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should download greeting', inject([ng.http.XHRBackend], function(backend) {
    backend.connections.subscribe(function(connection) {
      connection.mockRespond(new Response(new ResponseOptions({
        body: JSON.stringify({id:'ABC',content:'Hello World'})
      })));
    });
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.greeting.content).toEqual('Hello World');
  }));

});
