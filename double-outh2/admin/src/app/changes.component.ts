import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: './changes.component.html'
})
export class ChangesComponent {

  data: any;

  constructor(private http: HttpClient) {
    this.http.get('/resource/changes').subscribe(response => {
      this.data = response;
    });
  }

}
