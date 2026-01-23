import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppService {
  authenticated = false;
  private http = inject(HttpClient);

  authenticate(credentials: { username: string; password: string }, callback?: () => void): void {
    const headers = new HttpHeaders(credentials ? {
      'content-type': 'application/x-www-form-urlencoded'
    } : {});
    const params = new HttpParams()
      .set('username', credentials.username)
      .set('password', credentials.password);

    this.http.post('login', params.toString(), { headers }).subscribe({
      next: () => {
        this.authenticated = true;
        if (callback) {
          callback();
        }
      },
      error: () => {
        this.authenticated = false;
      }
    });
  }
}
