import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Demo';
  greeting = {};
  authenticated = false;
  user = '';
  constructor(private http: HttpClient) {
    http.get('/user').subscribe(data => {
      if (data['name']) {
        this.authenticated = true;
        http.get('/resource').subscribe(response => this.greeting = response);
      } else {
        this.authenticated = false;
      }
    }, () => { this.authenticated = false; });
  }
}
