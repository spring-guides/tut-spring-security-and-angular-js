import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  app = inject(AppService);
  private http = inject(HttpClient);
  private router = inject(Router);

  user: { name?: string } = {};
  authenticated = false;

  constructor() {
    this.app.authenticate(response => {
      this.user = response;
      this.authenticated = this.app.authenticated;
      this.message();
    });
  }

  logout() {
    this.http.post('logout', {}).subscribe(() => {
      this.app.authenticated = false;
      this.authenticated = false;
      this.router.navigateByUrl('/unauthenticated');
    });
  }

  message() {
    if (!this.app.authenticated) {
      this.router.navigate(['/unauthenticated']);
    } else {
      if (this.app.writer) {
        this.router.navigate(['/write']);
      } else {
        this.router.navigate(['/read']);
      }
    }
  }

  changes() {
    if (!this.app.authenticated) {
      this.router.navigate(['/unauthenticated']);
    } else {
      this.router.navigate(['/changes']);
    }
  }
}
