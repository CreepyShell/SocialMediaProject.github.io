import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, of } from 'rxjs';
import { commentModel } from '../models/CommentModel';
import { authService } from './auth.service';
import { httpService } from './http.service';

@Injectable()
export class commentService {
  constructor(
    private _httpService: httpService,
    private _authService: authService
  ) {}
  public getCommentsByPostId(postId: string, count: number) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService.getRequest<commentModel[]>(
      `/api/comments/${postId}/${count}`,
      this._httpService.setHttpHeader(
        ['Authorization'],
        [`Bearer ${accessToken}`]
      ),
      null
    );
  }

  public AddCommentToPost(comment: commentModel) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService
      .postRequest<commentModel>(
        '/api/comments',
        this._httpService.setHttpHeader(
          ['Authorization'],
          [`Bearer ${accessToken}`]
        ),
        comment
      )
      .pipe(
        catchError((err) => {
          return of(err as HttpErrorResponse);
        })
      );
  }

  public deleteComment(url: string, deletedComment: commentModel) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService.deleteRequest(
      url,
      this._httpService.setHttpHeader(
        ['Authorization'],
        [`Bearer ${accessToken}`]
      ),
      deletedComment
    );
  }

  public updateComment(updatedComment: commentModel) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage()!;
    return this._httpService.putRequest<commentModel>(
      '/api/comments',
      this._httpService.setHttpHeader(
        ['Authorization'],
        [`Bearer ${accessToken}`]
      ),
      updatedComment
    );
  }
}
