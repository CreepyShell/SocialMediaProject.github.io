import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { authService } from "../services/auth.service";

@Injectable()
export class authorizedGuard implements CanActivate{
    constructor(private _authService:authService, private router:Router){}
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        if(this._authService.getAccessTokenFromLocalStorage() && this._authService.getRefreshTokenFromLocalStorage()){
            this.router.navigate(['/loggedError']);
            return false;
        }
        return true;
    }

}

@Injectable()
export class nonAuthorizedGuard implements CanActivate{
    constructor(private _authService:authService, private router:Router){}
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        if(this._authService.getAccessTokenFromLocalStorage() && this._authService.getRefreshTokenFromLocalStorage()){
            return true;
        }
        this.router.navigate(['/login']);
        return false;
        
    }

}