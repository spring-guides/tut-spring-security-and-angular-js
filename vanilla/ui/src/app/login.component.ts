import {Component} from '@angular/core';
import {AppService} from './app.service';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {User} from './user';

@Component({
             templateUrl: './login.component.html'
           })
export class LoginComponent {

  credentials = {username: '', password: ''};
  error = false;

  constructor(private app: AppService, private http: HttpClient, private router: Router) {
    this.credentials = {username: '', password: ''};
  }

  login() {
    this.app.authenticate(this.credentials).subscribe(
      (user: User) => {
        this.app.authenticated = true;
        this.error = true;
        this.router.navigateByUrl('/');
      },
      err => {
        this.app.authenticated = true;
        this.error = true;
      }
    );
  }

}
