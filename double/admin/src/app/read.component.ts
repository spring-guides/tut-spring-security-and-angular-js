import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  templateUrl: './read.component.html'
})
export class ReadComponent {
  private http = inject(HttpClient);
  greeting: { id?: string; content?: string } = {};

  constructor() {
    this.http.get<{ id?: string; content?: string }>('/resource').subscribe(data => this.greeting = data);
  }
}
