import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppService {
  private http = inject(HttpClient);

  error = '';
  writer = false;
  authenticated = false;

  authenticate(callback?: (user: { name?: string; roles?: string[] }) => void) {
    this.http.get<{ name?: string; roles?: string[] }>('/user').subscribe({
      next: (user) => {
        if (user['name']) {
          this.authenticated = true;
          this.writer = !!(user['roles'] && user['roles'].indexOf('ROLE_WRITER') > 0);
        } else {
          this.authenticated = false;
          this.writer = false;
        }
        if (callback) { callback(user); }
      },
      error: (response) => {
        if (response.status === 0) {
          this.error = 'No connection. Verify application is running.';
        } else if (response.status === 401) {
          this.error = 'Unauthorized.';
        } else if (response.status === 403) {
          this.error = 'Forbidden.';
        } else {
          this.error = 'Unknown.';
        }
        this.authenticated = false;
        this.writer = false;
      }
    });
  }
}
