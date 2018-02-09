import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable()
export class AppService {

  authenticated = false;

  constructor(private http: HttpClient) {
  }

  authenticate(credentials, callback) {

        const headers = new HttpHeaders(credentials ? {
            'content-type' : 'application/x-www-form-urlencoded'
        } : {});
        const params = new HttpParams()
          .set('username', credentials['username'])
          .set('password', credentials['password']);

        this.http.post('login', params.toString(), {headers: headers}).subscribe(response => {
            this.authenticated = true;
            if (callback) { callback(); }
        }, () => {
          this.authenticated = false;
        });

    }

}
