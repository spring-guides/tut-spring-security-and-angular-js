import { Component } from '@angular/core';
import { AppService } from './app.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/finally';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  user: {};

  constructor(private app: AppService, private http: HttpClient, private router: Router) {
    app.authenticate(response => {
      this.user = response;
      this.message();
    });
  }

  logout() {
    this.http.post('logout', {}).subscribe(function() {
        this.app.authenticated = false;
        this.router.navigateByUrl('/login');
    });
  }

  message() {
    if (!this.app.authenticated) {
      this.router.navigate(['/unauthenticated']);
    } else {
      if (this.app.writer) {
        this.router.navigate(['/write']);
      } else {
        this.router.navigate(['/read']);
      }
    }
  }

  changes() {
    if (!this.app.authenticated) {
      this.router.navigate(['/unauthenticated']);
    } else {
      this.router.navigate(['/changes']);
    }
  }

}
