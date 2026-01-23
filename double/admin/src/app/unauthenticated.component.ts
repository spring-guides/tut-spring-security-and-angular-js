import { Component, inject } from '@angular/core';
import { AppService } from './app.service';

@Component({
  standalone: true,
  templateUrl: './unauthenticated.component.html'
})
export class UnauthenticatedComponent {
  app = inject(AppService);
  error = '';

  constructor() {
    this.error = this.app.error;
  }
}
