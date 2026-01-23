import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { ReadComponent } from './app/read.component';
import { WriteComponent } from './app/write.component';
import { ChangesComponent } from './app/changes.component';
import { UnauthenticatedComponent } from './app/unauthenticated.component';
import { xhrInterceptor } from './app/xhr.interceptor';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'read' },
  { path: 'read', component: ReadComponent },
  { path: 'write', component: WriteComponent },
  { path: 'unauthenticated', component: UnauthenticatedComponent },
  { path: 'changes', component: ChangesComponent }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([xhrInterceptor]))
  ]
}).catch(err => console.error(err));
