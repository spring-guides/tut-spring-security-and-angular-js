import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: './read.component.html'
})
export class ReadComponent {

  greeting = {};

  constructor(private http: HttpClient) {
    http.get('http://localhost:9000').subscribe(data => this.greeting = data);
  }

}
