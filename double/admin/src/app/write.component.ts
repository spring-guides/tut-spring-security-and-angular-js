import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './write.component.html'
})
export class WriteComponent {
  private http = inject(HttpClient);
  greeting: { id?: string; content?: string } = {};

  constructor() {
    this.http.get<{ id?: string; content?: string }>('/resource').subscribe(data => this.greeting = data);
  }

  update() {
    this.http.post<{ id?: string; content?: string }>('/resource', { content: this.greeting['content'] }).subscribe(response => {
      this.greeting = response;
    });
  }
}
