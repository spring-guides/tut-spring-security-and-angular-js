import { Component, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppService } from './app.service';

interface Greeting {
  id?: number;
  content?: string;
}

interface TokenResponse {
  token?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html'
})
export class HomeComponent {
  title = 'Demo';
  greeting: Greeting = {};

  private app = inject(AppService);
  private http = inject(HttpClient);

  constructor() {
    this.http.get<TokenResponse>('token').subscribe({
      next: (data) => {
        const token = data.token;
        if (token) {
          this.http.get<Greeting>('http://localhost:9000', {
            headers: new HttpHeaders().set('X-Auth-Token', token)
          }).subscribe(response => this.greeting = response);
        }
      },
      error: () => {}
    });
  }

  authenticated(): boolean {
    return this.app.authenticated;
  }
}
