import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule, Injectable } from '@angular/core';
import {
  HttpClientModule, HttpInterceptor, HttpHandler, HttpRequest, HTTP_INTERCEPTORS
} from '@angular/common/http';

import { AppComponent } from './app.component';

@Injectable()
export class XhrInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const xhr = req.clone({
      headers: req.headers.set('X-Requested-With', 'XMLHttpRequest')
    });
    return next.handle(xhr);
  }
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: XhrInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
