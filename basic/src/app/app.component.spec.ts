import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    // Flush the initial HTTP request
    httpMock.expectOne('resource').flush({ id: 1, content: 'Hello' });
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Demo'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    httpMock.expectOne('resource').flush({ id: 1, content: 'Hello' });
    expect(app.title).toEqual('Demo');
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    httpMock.expectOne('resource').flush({ id: 1, content: 'Hello' });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Welcome Demo!');
  });

  it('should fetch data from backend', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    httpMock.expectOne('resource').flush({ id: 1, content: 'Hello' });
    fixture.detectChanges();
    expect(app.greeting.content).toContain('Hello');
  });
});
