import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable, of} from 'rxjs';
import {AppService} from './app.service';

@Injectable({
              providedIn: 'root'
            })
export class AuthGuardService implements CanActivate {

  constructor(private appService: AppService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.appService.authenticated) {
      this.appService.showMessage = true;
      this.appService.message = 'Vous devez vous connecter avant d\'accéder à cette page';
    }
    return of(this.appService.authenticated);
  }
}
