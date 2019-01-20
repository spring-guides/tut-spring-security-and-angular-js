import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {User} from './user';
import {catchError, map} from 'rxjs/operators';

@Injectable()
export class AppService {
  message = '';
  authenticated = false;
  user: User;
  showMessage = false;

  constructor(private http: HttpClient) {
  }

  authenticate(credentials): Observable<boolean> {
    let headers = {} as HttpHeaders;
    if (credentials) {
      headers = new HttpHeaders({
                                  'content-type': 'application/x-www-form-urlencoded'
                                });
    }
    const params = new HttpParams()
      .set('username', credentials[ 'username' ])
      .set('password', credentials[ 'password' ]);

    return this.http.post('/api/login', params.toString(), {headers: headers}).pipe(
      map((userData: any) => {
        this.authenticated = true;
        this.user = {username: userData.principal.username, authorities: userData.authorities};
        console.log(JSON.stringify(userData));
        return true;
      }),
      catchError(err => {
        this.authenticated = false;
        this.user = undefined;
        return of(false);
      })
    );
  }

  logout(): Observable<boolean> {
    return this.http.post('api/logout', {}, {responseType: 'text'}).pipe(
      map(() => {
        this.authenticated = false;
        this.user = undefined;
        return true;
      }),
      catchError(err => {
        console.error('logout failed:' + err);
        return of(false);
      })
    );
  }

}
