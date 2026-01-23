import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor } from '@angular/common';

@Component({
  standalone: true,
  imports: [NgFor],
  templateUrl: './changes.component.html'
})
export class ChangesComponent {
  private http = inject(HttpClient);
  data: Array<{ timestamp?: string; user?: string; message?: string }> = [];

  constructor() {
    this.http.get<Array<{ timestamp?: string; user?: string; message?: string }>>('/resource/changes').subscribe(response => {
      this.data = response;
    });
  }
}
