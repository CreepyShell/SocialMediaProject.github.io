import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { postModel } from '../models/PostModel';
import { authService } from './auth.service';
import { httpService } from './http.service';

@Injectable()
export class postService {
  constructor(
    private _httpService: httpService,
    private _authService: authService
  ) { }

  public getPostsById(id: string) {
    this._httpService.getRequest<postModel>(
      `/api/posts/${id}`,
      this._httpService.setHttpHeader([], []),
      null
    );
  }
  public getAllPosts() {
    return this._httpService
      .getRequest<postModel[]>(
        '/api/posts',
        this._httpService.setHttpHeader([], []),
        null
      )
      .pipe(catchError((err) => of(err as HttpErrorResponse)));
  }

  public createPost(post: postModel) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService
      .postRequest<postModel>(
        '/api/posts',
        this._httpService.setHttpHeader(
          ['Authorization'],
          [`Bearer ${accessToken}`]
        ),
        post
      )
      .pipe(
        catchError((err) => {
          return of(err as HttpErrorResponse);
        })
      );
  }

  private deletePost(url: string) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService
      .deleteRequest(
        url,
        this._httpService.setHttpHeader(
          ['Authorization'],
          [`Bearer ${accessToken}`]
        ),
        null
      )
      .pipe(
        catchError((err) => {
          console.log(err);
          return of(err as HttpErrorResponse);
        })
      );
  }

  public deletePostLikeUser(postId: string) {
    return this.deletePost(`/api/posts/${postId}`);
  }

  public deletePostLikeAdmin(postId: string, username: string) {
    return this.deletePost(`/api/posts/admin/${username}/${postId}`);
  }

  public updatePost(newPost: postModel) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService
      .putRequest<postModel>(
        '/api/posts',
        this._httpService.setHttpHeader(
          ['Authorization'],
          [`Bearer ${accessToken}`]
        ),
        newPost
      )
      .pipe(
        catchError((err) => {
          return of(err as HttpErrorResponse);
        })
      );
  }

  public getMostPopularPosts(count: number) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService.getRequest<postModel[]>(`/api/posts/popular/${count}`, this._httpService.setHttpHeader(
      ['Authorization'],
      [`Bearer ${accessToken}`]
    ), null);
  }

  public getMostDiscussionPosts(count: number) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService.getRequest<postModel[]>(`/api/posts/discussed/${count}`, this._httpService.setHttpHeader(
      ['Authorization'],
      [`Bearer ${accessToken}`]
    ), null);
  }
}
