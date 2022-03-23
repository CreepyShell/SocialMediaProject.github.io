import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthUserModel } from '../models/User/AuthUserModel';
import { Token } from '../models/User/Token';
import { UserModel } from '../models/User/UserModel';
import { httpService } from './http.service';

@Injectable()
export class authService {
  constructor(
    private _httpService: httpService
  ) {}
  private user:UserModel | undefined;

  public getUser(){
    if(this.user){
      return of(this.user);
    }
    return this.getUserFromToken();
  }

  public registerUser(user: AuthUserModel) {
    return this._httpService
      .postRequest<UserModel>(
        '/api/auth/register',
        this._httpService.setHttpHeader([], []),
        user
      )
      .pipe(
        map((resp) => {
          this.setTokenInLocalStorage(
            resp.body!.token.accessToken,
            resp.body!.token.refreshToken
          );
          this.user = resp.body!;
          return resp;
        }),
        catchError((err) => {
          return of(err as HttpErrorResponse);
        })
      );
  }

  public loginUser(user: AuthUserModel) {
    return this._httpService
      .postRequest<UserModel>(
        '/api/auth/login',
        this._httpService.setHttpHeader([], []),
        user
      )
      .pipe(
        map((resp) => {
          this.setTokenInLocalStorage(
            resp.body!.token.accessToken,
            resp.body!.token.refreshToken
          );
          this.user = resp.body!;
          return resp;
        }),
        catchError((err) => {
          return of(err as HttpErrorResponse);
        })
      );
  }

  public refreshToken(refreshToken: string, accessToken: string) {
    let header: HttpHeaders = this._httpService.setHttpHeader(
      ['accessToken', 'refreshToken'],
      [accessToken, refreshToken]
    );
    return this._httpService
      .putRequest<Token>('/api/token/refresh', header, null)
      .pipe(
        map((resp) => {
          this.setTokenInLocalStorage(
            resp.body!.accessToken,
            resp.body!.refreshToken
          );
          if (this.user) {
            (this.user.token.accessToken = this.getAccessTokenFromLocalStorage()!),
              (this.user.token.refreshToken =
                this.getRefreshTokenFromLocalStorage()!);
          }

          return resp;
        }),
        catchError((err) => of(err as HttpErrorResponse))
      );
  }

  public getUserFromToken() {
    let accessToken = this.getAccessTokenFromLocalStorage();
    let httpHeaders = this._httpService.setHttpHeader(
      ['Authorization'],
      [`Bearer ${accessToken}`]
    );
    if (accessToken) {
      return this._httpService
        .getRequest<UserModel>('/api/users/fromtoken', httpHeaders, null)
        .pipe(
          map((resp) => {
            this.user = resp.body!;
            return resp.body!;
          }),
          catchError((err) => of(err as HttpErrorResponse))
        );
    }
    return null;
  }

  public logout(user: UserModel) {
    return this._httpService
      .putRequest(
        '/api/auth/logOut',
        this._httpService.setHttpHeader([], []),
        user
      )
      .pipe(
        map((resp) => {
          this.user = undefined;
          localStorage.clear();
          return resp;
        }),
        catchError((err) => {
          return of( err as HttpErrorResponse);
        })
      );
  }

  public checkIsUserHaveAtLeastOneRole(user:UserModel,roles:string[]) : boolean{
    if(!user || !roles){
      return false;
    }
    for (let index = 0; index < roles.length; index++) {
      if(user.roles.includes(roles[index])){
        return true;
      }
    }
    return false;
  }

  public setTokenInLocalStorage(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  public getAccessTokenFromLocalStorage(): string | null {
    return localStorage.getItem('accessToken');
  }
  public getRefreshTokenFromLocalStorage(): string | null {
    return localStorage.getItem('refreshToken');
  }
}
