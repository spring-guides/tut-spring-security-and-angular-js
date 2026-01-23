import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Greeting {
  id?: number;
  content?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Demo';
  greeting: Greeting = {};

  private http = inject(HttpClient);

  constructor() {
    this.http.get<Greeting>('resource').subscribe(data => this.greeting = data);
  }
}
