import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
    this.login();
  }

  login() {
    const headers = this.credentials.username ? new HttpHeaders().set(
      'authorization', 'Basic ' + btoa(this.credentials.username + ':' + this.credentials.password)
    ) : new HttpHeaders();
    this.http.get('user', {headers: headers}).subscribe(data => {
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
