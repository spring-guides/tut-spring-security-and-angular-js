import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: './write.component.html'
})
export class WriteComponent {

  greeting = {};

  constructor(private http: HttpClient) {
    this.http.get('http://localhost:9000').subscribe(data => this.greeting = data);
  }

  update() {
    this.http.post('/resource', {content: this.greeting['content']}).subscribe(response => {
      this.greeting = response;
    });
  }

}
