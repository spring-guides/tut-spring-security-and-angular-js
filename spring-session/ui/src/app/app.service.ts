import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppService {
  authenticated = false;
  private http = inject(HttpClient);

  authenticate(credentials: { username: string; password: string } | undefined, callback?: () => void): void {
    const headers = new HttpHeaders(credentials ? {
      authorization: 'Basic ' + btoa(credentials.username + ':' + credentials.password)
    } : {});

    this.http.get<{ name?: string }>('user', { headers }).subscribe({
      next: (response) => {
        this.authenticated = !!response?.name;
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
