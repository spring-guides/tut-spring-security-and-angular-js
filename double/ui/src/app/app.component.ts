import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private http = inject(HttpClient);

  title = 'Demo';
  greeting: { id?: string; content?: string } = {};
  authenticated = false;
  user = '';

  constructor() {
    this.http.get<{ name?: string }>('/user').subscribe({
      next: (data) => {
        if (data['name']) {
          this.authenticated = true;
          this.user = data['name'];
          this.http.get<{ id?: string; content?: string }>('/resource').subscribe(response => this.greeting = response);
        } else {
          this.authenticated = false;
        }
      },
      error: () => {
        this.authenticated = false;
      }
    });
  }
}
