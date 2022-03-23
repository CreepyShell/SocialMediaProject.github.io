import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Token } from '../models/User/Token';
import { UserModel } from '../models/User/UserModel';
import { authService } from './auth.service';
import { httpService } from './http.service';

@Injectable()
export class userService {
  constructor(
    private _httpService: httpService,
    private _authService: authService
  ) {}

  public changePass(currentPass: string, newPassword: string) {
    let headers: HttpHeaders = this._httpService.setHttpHeader(
      ['currentPassword', 'newPassword', 'Authorization'],
      [
        currentPass,
        newPassword,
        `Bearer ${this._authService.getAccessTokenFromLocalStorage()}`,
      ]
    );
    return this._httpService
      .putRequest<Token>('/api/auth/changepass', headers, null)
      .pipe(
        map((resp) => {
          this._authService.setTokenInLocalStorage(
            resp.body!.accessToken,
            resp.body!.refreshToken
          );
          return resp;
        }),
        catchError((err) => {
          return of(err as HttpErrorResponse);
        })
      );
  }

  public changeCodeWords(codeWords: string, user: UserModel) {
    let headers: HttpHeaders = this._httpService.setHttpHeader(
      ['newCodeWords', 'Authorization'],
      [
        codeWords,
        `Bearer ${this._authService.getAccessTokenFromLocalStorage()}`,
      ]
    );
    return this._httpService
      .putRequest('/api/auth/changecodewords', headers, user)
      .pipe(catchError((err) => of(err as HttpErrorResponse)));
  }

  public deleteUser(user: UserModel) {
    return this._httpService
      .deleteRequest<boolean>(
        '/api/users',
        this._httpService.setHttpHeader(
          ['Authorization'],
          [`Bearer ${this._authService.getAccessTokenFromLocalStorage()}`]
        ),
        user
      )
      .pipe(
        map((resp) => {
          localStorage.clear();
          return resp;
        }),
        catchError((err) => of(err as HttpErrorResponse))
      );
  }

  public updateUser(user: UserModel) {
    user.registeredAt = undefined;
    return this._httpService
      .putRequest<UserModel>(
        '/api/users',
        this._httpService.setHttpHeader(
          ['Authorization'],
          [`Bearer ${this._authService.getAccessTokenFromLocalStorage()}`]
        ),
        user
      )
      .pipe(
        map((resp) => {
          return resp;
        }),
        catchError((err) => {
          console.log(err);
          return of(err as HttpErrorResponse);
        })
      );
  }

  public getUserById(userId: string) {
    return this._httpService.getRequest<UserModel>(
      `/api/users/userinfo/${userId}`,
      this._httpService.setHttpHeader([], []),
      null
    );
  }
}
