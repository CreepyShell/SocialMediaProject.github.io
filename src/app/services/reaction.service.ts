import { Injectable } from '@angular/core';
import { reactionModel } from '../models/ReactionModel';
import { authService } from './auth.service';
import { httpService } from './http.service';

@Injectable()
export class reactionService {
  constructor(
    private _httpService: httpService,
    private _authService: authService
  ) {}

  public getReactionByPostId(postId: string) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService.getRequest<reactionModel[]>(
      `/api/reactions/postreactions/${postId}`,
      this._httpService.setHttpHeader(
        ['Authorization'],
        [`Bearer ${accessToken}`]
      ),
      null
    );
  }

  public reactToPost(reaction: reactionModel) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService.putRequest<reactionModel | undefined>(
      '/api/reactions/post',
      this._httpService.setHttpHeader(
        ['Authorization'],
        [`Bearer ${accessToken}`]
      ),
      reaction
    );
  }

  public getReactionByCommentId(commentId: string) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService.getRequest<reactionModel[]>(
      `/api/reactions/commentreactions/${commentId}`,
      this._httpService.setHttpHeader(
        ['Authorization'],
        [`Bearer ${accessToken}`]
      ),
      null
    );
  }

  public reactToComment(reaction: reactionModel) {
    let accessToken = this._authService.getAccessTokenFromLocalStorage();
    return this._httpService.putRequest<reactionModel | undefined>(
      '/api/reactions/comment',
      this._httpService.setHttpHeader(
        ['Authorization'],
        [`Bearer ${accessToken}`]
      ),
      reaction
    );
  }
}
