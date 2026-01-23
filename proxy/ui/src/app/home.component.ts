import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppService } from './app.service';

interface Greeting {
  id?: number;
  content?: string;
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
    this.http.get<Greeting>('resource').subscribe(data => this.greeting = data);
  }

  authenticated(): boolean {
    return this.app.authenticated;
  }
}
