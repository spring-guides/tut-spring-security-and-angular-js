import { Component } from '@angular/core';
import { AppService } from './app.service';

@Component({
  templateUrl: './unauthenticated.component.html'
})
export class UnauthenticatedComponent {

  error: string;

  constructor(private app: AppService) {
    this.error = app.error;
  }

}
