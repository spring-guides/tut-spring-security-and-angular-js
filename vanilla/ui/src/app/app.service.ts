import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from './user';

@Injectable()
export class AppService {

  authenticated = false;

  constructor(private http: HttpClient) {
  }

  authenticate(credentials): Observable<User> {

    const headers = new HttpHeaders(credentials ? {
      'content-type': 'application/x-www-form-urlencoded'
    } : {});
    const params = new HttpParams()
      .set('username', credentials[ 'username' ])
      .set('password', credentials[ 'password' ]);

    return this.http.post('/login', params.toString(), {headers: headers});
  }

}
