import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable, of} from 'rxjs';
import {AppService} from './app.service';

@Injectable({
              providedIn: 'root'
            })
export class ClearGuardService implements CanActivate {

  constructor(private appService: AppService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    this.appService.showMessage = false;
    this.appService.message = '';
    return of(true);
  }
}
