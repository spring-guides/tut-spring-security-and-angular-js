import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from './user';

@Injectable()
export class AppService {

  authenticated = false;
  user: User;

  constructor(private http: HttpClient) {
  }

  authenticate(credentials): Observable<User> {

    let headers = {} as HttpHeaders;
    if (credentials) {
      headers = new HttpHeaders({
                                  'content-type': 'application/x-www-form-urlencoded'
                                });
    }
    const params = new HttpParams()
      .set('username', credentials[ 'username' ])
      .set('password', credentials[ 'password' ]);

    return this.http.post('/api/login', params.toString(), {headers: headers});
  }

}
