import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private http = inject(HttpClient);

  title = 'Demo';
  authenticated = false;
  greeting: { id?: string; content?: string } = {};

  constructor() {
    this.authenticate();
  }

  authenticate() {
    this.http.get<{ name?: string }>('user').subscribe({
      next: (response) => {
        if (response['name']) {
          this.authenticated = true;
          this.http.get<{ id?: string; content?: string }>('resource').subscribe(data => this.greeting = data);
        } else {
          this.authenticated = false;
        }
      },
      error: () => {
        this.authenticated = false;
      }
    });
  }

  logout() {
    this.http.post('logout', {}).pipe(
      finalize(() => {
        this.authenticated = false;
        this.http.post('http://localhost:9999/logout', {}, {})
            .subscribe(() => {
                console.log('Logged out');
        });
      })
    ).subscribe();
  }
}
