import {Component, OnInit} from '@angular/core';
import {AppService} from '../app.service';

@Component({
             selector: 'app-user-details',
             templateUrl: './user-details.component.html',
             styleUrls: [ './user-details.component.css' ]
           })
export class UserDetailsComponent implements OnInit {

  constructor(private appService: AppService) {
  }

  get user() {
    return this.appService.user;
  }

  ngOnInit() {
  }

}
