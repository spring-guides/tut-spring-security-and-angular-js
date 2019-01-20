import {Component} from '@angular/core';
import {AppService} from './app.service';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';

@Component({
             selector: 'app-root',
             templateUrl: './app.component.html',
             styleUrls: [ './app.component.css' ]
           })
export class AppComponent {

  constructor(private app: AppService, private http: HttpClient, private router: Router) {
  }

  get showMessage() {
    return this.app.showMessage;
  }

  get message() {
    return this.app.message;
  }

  logout() {
    this.app.logout().subscribe(
      success => {
        if (success) {
          this.router.navigateByUrl('/login');
          this.app.showMessage = false;
        } else {
          this;
          this.app.showMessage = true;
          this.app.message='Le logout n\'a pu être fait car une erreur s\'est produite';
        }
      }
    );
  }

}
