import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private http = inject(HttpClient);

  admin = false;
  user = '';
  title = 'Demo';
  credentials = { username: '', password: '' };
  authenticated = false;
  error = false;

  constructor() {
    this.login();
  }

  login() {
    const headers = this.credentials.username
      ? new HttpHeaders().set('authorization', 'Basic ' + btoa(this.credentials.username + ':' + this.credentials.password))
      : new HttpHeaders();

    this.http.get<{ name?: string; roles?: string[] }>('user', { headers }).subscribe({
      next: (data) => {
        this.authenticated = !!(data && data['name']);
        this.user = this.authenticated ? data['name'] || '' : '';
        this.admin = this.authenticated && !!data['roles'] && data['roles'].indexOf('ROLE_ADMIN') > -1;
        this.error = false;
      },
      error: () => {
        this.authenticated = false;
        this.admin = false;
        this.error = true;
      }
    });
    return false;
  }

  logout() {
    this.http.post('logout', {}).subscribe({
      next: () => {
        this.authenticated = false;
        this.admin = false;
      }
    });
  }
}
