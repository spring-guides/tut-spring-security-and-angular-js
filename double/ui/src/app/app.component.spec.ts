import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    httpMock.expectOne('/user').flush({ name: 'user' });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have title Demo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    httpMock.expectOne('/user').flush({ name: 'user' });
    expect(fixture.componentInstance.title).toEqual('Demo');
  });
});
