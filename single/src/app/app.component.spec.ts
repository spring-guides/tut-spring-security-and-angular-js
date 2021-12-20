import { TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      declarations: [
        AppComponent
      ],
      providers: [ AppService ]
    }).compileComponents();
  }));
  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should be unauthenticated`, waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.app.authenticated).toBeFalsy();
  }));
  it('should render tab', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.whenRenderingDone().then(
      () => {
        const compiled = fixture.debugElement.nativeElement as HTMLElement;
        expect(compiled.querySelector('.active')?.textContent).toContain('Home');
      }
    )
    fixture.detectChanges();
  }));
});
