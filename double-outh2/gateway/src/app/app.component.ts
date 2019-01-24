import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/finally';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  admin: boolean;
  user: any;
  title = 'Demo';
  credentials = {username: '', password: ''};
  authenticated = false;

  constructor(private http: HttpClient) {
    this.authenticate();
  }

  authenticate() {
    this.http.get('user').subscribe(data => {
      this.authenticated = data && data['name'];
      this.user = this.authenticated ? data['name'] : '';
      this.admin = this.authenticated && data['roles'] && data['roles'].indexOf('ROLE_ADMIN') > -1;
    });
    return false;
  }

  logout() {
      this.http.post('logout', {}).subscribe(function() {
          this.authenticated = false;
          this.admin = false;
      });
  }

}
