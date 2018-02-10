import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AppService } from './app.service';
import { AppComponent } from './app.component';
import { ReadComponent } from './read.component';
import { WriteComponent } from './write.component';
import { ChangesComponent } from './changes.component';
import { UnauthenticatedComponent } from './unauthenticated.component';
import {
  HttpClientModule, HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HTTP_INTERCEPTORS
} from '@angular/common/http';

import { Observable } from 'rxjs/Observable';

@Injectable()
export class XhrInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const xhr = req.clone({
      headers: req.headers.set('X-Requested-With', 'XMLHttpRequest')
    });
    return next.handle(xhr);
  }
}

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'read'},
  { path: 'read', component: ReadComponent},
  { path: 'write', component: WriteComponent},
  { path: 'unauthenticated', component: UnauthenticatedComponent},
  { path: 'changes', component: ChangesComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    ReadComponent,
    WriteComponent,
    ChangesComponent,
    UnauthenticatedComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [AppService, { provide: HTTP_INTERCEPTORS, useClass: XhrInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
