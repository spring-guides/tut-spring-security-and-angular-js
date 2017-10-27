var TestBed = ng.core.testing.TestBed;
var async = ng.core.testing.async;

describe("App", function() {

  beforeEach(async(() =>{
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
})
