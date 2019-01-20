import {Component} from '@angular/core';
import {AppService} from './app.service';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';

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
      (success: boolean) => {
        this.error = !success;
        if (success) {
          this.router.navigateByUrl('/');
        }
      }
    );
  }
}
