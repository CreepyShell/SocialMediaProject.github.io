import {
  HttpErrorResponse,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { commentModel } from 'src/app/models/CommentModel';
import { reactionModel } from 'src/app/models/ReactionModel';
import { UserModel } from 'src/app/models/User/UserModel';
import { authService } from 'src/app/services/auth.service';
import { commentService } from 'src/app/services/comment.service';
import { reactionService } from 'src/app/services/reaction.service';
import { userService } from 'src/app/services/user.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
})
export class CommentComponent implements OnInit, OnDestroy {
  @Input() User!: UserModel;
  @Input() Comment!: commentModel;
  @Output() deleteCommentEvent = new EventEmitter<string>();
  constructor(
    private _authService: authService,
    private _commentService: commentService,
    private _userService: userService,
    private _reactionService: reactionService
  ) {}

  public commentAuthor!: UserModel;
  public disableLikes = false;
  public isOpenSentButton = false;
  public commentReaction: reactionModel[] = [];
  public positiveReactionsCount: number = 0;
  public errorUpdateMessage: string | undefined = undefined;

  private defaultColor = 'rgb(173, 173, 173)';
  private currentColor = this.defaultColor;
  private dislikeColor = '#8F8F8F';
  private likeColor = '#C0C0C0';
  public likeStyle: { [klass: string]: any } | null = {
    'color': this.defaultColor,
    'font-size': 'large',
  };
  public dislikeStyle: { [klass: string]: any } | null = {
    'color': this.defaultColor,
    'font-size': 'large',
  };

  private $unsubscribe = new Subject<void>();
  ngOnInit(): void {
    this.getCommentAuthor();
    this.getCommentReactions();
  }

  public reactComment(isLike: boolean) {
    this.disableLikes = false;
    let reaction: reactionModel = {
      id: undefined,
      userId: this.User!.id,
      commentId: this.Comment!.id,
      postId: undefined,
      isLike: isLike,
      reactedAt: undefined,
    };

    this._reactionService
      .reactToComment(reaction)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          this.disableLikes = false;
          if (resp.body) {
            let existReaction = this.commentReaction.find(
              (pr) => pr.id === resp.body!.id
            );
            if (!existReaction) {
              this.commentReaction.push(resp.body);
              if (resp.body.isLike) {
                this.positiveReactionsCount++;
                this.currentColor = this.likeColor;
              }
              return;
            }
            existReaction.isLike = !existReaction.isLike;

            if (existReaction.isLike) {
              this.positiveReactionsCount++;
            } else {
              this.positiveReactionsCount--;
            }
            return;
          }

          let deletedReaction = this.commentReaction.find(
            (pr) =>
              pr.userId === reaction.userId &&
              pr.commentId === reaction.commentId
          );
          let index = this.commentReaction.indexOf(deletedReaction!);
          this.commentReaction.splice(index, 1);
          if (deletedReaction!.isLike) {
            this.positiveReactionsCount--;
          }
        },
        error: (err) => {
          if (err.status === HttpStatusCode.Unauthorized) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe((resp) => {
                if (
                  resp instanceof HttpResponse &&
                  resp.status === HttpStatusCode.Ok
                ) {
                  this.User.token = resp.body!;
                  this.reactComment(isLike);
                }
              });
          }
        },
      });
  }

  public canDeleteLikeAdmin() {
    if (this.canChangeLikeUser()) {
      return false;
    }
    if (
      this.User &&
      this._authService.checkIsUserHaveAtLeastOneRole(this.User, [
        'Administrator',
        'Owner',
      ])
    ) {
      return true;
    }
    return false;
  }

  public openSendButton() {
    if (this.isOpenSentButton) {
      document.getElementById('comment-text' + this.Comment.id)!.innerText =
        this.Comment.commentText;
    }
    this.isOpenSentButton = !this.isOpenSentButton;
  }

  public canChangeLikeUser() {
    if (
      this.User &&
      !this._authService.checkIsUserHaveAtLeastOneRole(this.User, [
        'BannedUser',
      ]) &&
      this.Comment.userId === this.User.id
    ) {
      return true;
    }
    return false;
  }

  public deleteCommentLikeUser() {
    this._commentService
      .deleteComment('/api/comments', this.Comment)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (resp.status === HttpStatusCode.Ok) {
            this.deleteCommentEvent.emit(this.Comment.id);
          }
        },
        error: (err) => {
          if (
            err instanceof HttpErrorResponse &&
            err.status == HttpStatusCode.Unauthorized
          ) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe((resp) => {
                if (
                  resp instanceof HttpResponse &&
                  resp.status == HttpStatusCode.Ok
                ) {
                  this.User.token = resp.body!;
                  this.deleteCommentLikeUser();
                }
              });
          }
        },
      });
  }

  public deleteCommentLikeAdmin() {
    this._commentService
      .deleteComment(
        `/api/comments/admin/${this.commentAuthor.id}`,
        this.Comment
      )
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (resp.status === HttpStatusCode.Ok) {
            this.deleteCommentEvent.emit(this.Comment.id);
          }
        },
        error: (err) => {
          if (err.status === HttpStatusCode.Unauthorized) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe((resp) => {
                if (
                  resp instanceof HttpResponse &&
                  resp.status === HttpStatusCode.Ok
                ) {
                  this.User.token = resp.body!;
                  this.deleteCommentLikeAdmin();
                }
              });
          }
        },
      });
  }

  public editComment() {
    let newCommentText = document.getElementById(
      'comment-text' + this.Comment.id
    )?.innerText;

    if (
      !newCommentText ||
      newCommentText.length < 2 ||
      newCommentText.length > 140
    ) {
      this.errorUpdateMessage = 'New comment is very short or very long';
      setTimeout(() => (this.errorUpdateMessage = undefined), 5000);
      return;
    }

    let oldText = this.Comment.commentText;
    this.Comment.commentText = newCommentText;
    this.Comment.createdAt = undefined;
    this._commentService
      .updateComment(this.Comment)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          this.Comment.createdAt = resp.body!.createdAt;
          this.openSendButton();
        },
        error: (err) => {
          this.Comment.commentText = oldText;
          if (
            err instanceof HttpErrorResponse &&
            err.status == HttpStatusCode.Unauthorized
          ) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe((resp) => {
                if (
                  resp instanceof HttpResponse &&
                  resp.status == HttpStatusCode.Ok
                ) {
                  this.User.token = resp.body!;
                  this.editComment();
                }
              });
          }
        },
      });
  }

  private getCommentAuthor() {
    this._userService
      .getUserById(this.Comment.userId)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          this.commentAuthor = resp.body!;
        },
        error: (err) => console.log(err),
      });
  }

  private getCommentReactions() {
    this._reactionService
      .getReactionByCommentId(this.Comment.id!)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          this.commentReaction = resp.body!;
          this.positiveReactionsCount = resp.body!.filter(
            (cr) => cr.isLike
          ).length;
        },
        error: (err) => {
          if (
            err instanceof HttpErrorResponse &&
            err.status == HttpStatusCode.Unauthorized
          ) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe((resp) => {
                if (
                  resp instanceof HttpResponse &&
                  resp.status == HttpStatusCode.Ok
                ) {
                  this.User.token = resp.body!;
                  this.getCommentReactions();
                }
              });
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }
}
