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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { commentModel } from 'src/app/models/CommentModel';
import { postModel } from 'src/app/models/PostModel';
import { reactionModel } from 'src/app/models/ReactionModel';
import { UserModel } from 'src/app/models/User/UserModel';
import { authService } from 'src/app/services/auth.service';
import { commentService } from 'src/app/services/comment.service';
import { postService } from 'src/app/services/post.service';
import { reactionService } from 'src/app/services/reaction.service';
import { userService } from 'src/app/services/user.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
})
export class PostComponent implements OnInit, OnDestroy {
  @Input() User: UserModel | undefined;
  @Input() Post: postModel | undefined;
  @Output() deletePostEvent = new EventEmitter<string>();
  public postReactions: reactionModel[] = [];
  public postAuthor: UserModel | undefined;
  public comments: commentModel[] = [];
  public isOpenComments = false;
  public isLoadAuthor = false;
  public isEditable = false;
  public error_updatePost_message: string | undefined = undefined;
  public reactionCount = 0;
  public positiveReactionsCount = 0;
  public disabled_likes = false;
  public isOpenSingleCommentContainer = false;

  private whiteColor = 'rgb(140, 140, 140)';
  private dislikeColor = '#FF8066';
  private likeColor = '#4FFBDF';
  public likeStyle: { [klass: string]: any } | null = {
    color: this.whiteColor,
  };
  public dislikeStyle: { [klass: string]: any } | null = {
    color: this.whiteColor,
  };

  private $unsubscribe = new Subject<void>();

  constructor(
    private _userService: userService,
    private _authService: authService,
    private _postService: postService,
    private _reactionService: reactionService,
    private _commentService: commentService,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this._userService
      .getUserById(this.Post!.userId)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          this.postAuthor = resp.body!;
          this.isLoadAuthor = true;
        },
        error: (err) => {
          console.log(err);
        },
      });
    this.getPostReactions();
    this.getComments();
  }

  public canDeleteLikeAdmin(): boolean {
    if (this.canDeleteLikeUser() || !this.User || !this.postAuthor) {
      return false;
    }

    if (
      this._authService.checkIsUserHaveAtLeastOneRole(this.User!, [
        'Administrator',
        'Owner',
      ]) ||
      this.User.id === this.postAuthor!.id
    ) {
      return true;
    }
    return false;
  }

  public canDeleteLikeUser(): boolean {
    if (this.User && this.postAuthor && this.User.id === this.postAuthor.id) {
      return true;
    }
    return false;
  }

  public canUpdate(): boolean {
    if (this.User && this.postAuthor && this.User.id === this.postAuthor.id) {
      return true;
    }
    return false;
  }

  public deletePostLikeAdmin() {
    if (!this.Post || !this.User) {
      return;
    }
    this._postService
      .deletePostLikeAdmin(this.Post.id!, this.postAuthor!.userName)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (resp.status === HttpStatusCode.Ok) {
            this.deletePostEvent.emit(this.Post!.id);
          } else if (resp.status === HttpStatusCode.Unauthorized) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe({
                next: (resp) => {
                  if (
                    resp.status === HttpStatusCode.Ok &&
                    resp instanceof HttpResponse
                  ) {
                    this.User!.token = resp.body!;
                    this.deletePostLikeAdmin();
                    return;
                  }
                },
                error: (err) => console.log(err),
              });
          }
        },
        error: (err) => console.log(err),
      });
  }

  public deletePostLikeUser() {
    if (!this.Post || !this.User) {
      return;
    }

    this._postService
      .deletePostLikeUser(this.Post.id!)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (resp.status === HttpStatusCode.Ok) {
            this.deletePostEvent.emit(this.Post?.id);
          } else if (resp.status === HttpStatusCode.Unauthorized) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe({
                next: (resp) => {
                  if (
                    resp.status === HttpStatusCode.Ok &&
                    resp instanceof HttpResponse
                  ) {
                    this.User!.token = resp.body!;
                    this.deletePostLikeUser();
                    return;
                  }
                },
                error: (err) => console.log(err),
              });
          }
        },
        error: (err) => console.log(err),
      });
  }

  public editPost() {
    if (this.isEditable) {
      document.getElementById(`${this.Post!.id!} header`)!.innerHTML =
        this.Post!.header;
      document.getElementById(`${this.Post!.id!} text`)!.innerHTML =
        this.Post!.text;
    }
    this.isEditable = !this.isEditable;
  }

  public updatePost() {
    let newHeader = document.getElementById(
      `${this.Post!.id!} header`
    )?.innerHTML;
    let newDescription = document.getElementById(
      `${this.Post!.id!} text`
    )?.innerHTML;

    let cachedPost: postModel = { ...this.Post! };
    cachedPost!.header = newHeader!;
    cachedPost!.text = newDescription!;
    cachedPost!.createdAt = undefined;
    cachedPost!.updatedAt = undefined;

    this._postService
      .updatePost(cachedPost!)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (
            resp instanceof HttpResponse &&
            resp.status === HttpStatusCode.Ok
          ) {
            this.Post!.header = resp.body!.header;
            this.Post!.text = resp.body!.text;
            this.Post!.updatedAt = resp.body!.updatedAt;
            this.Post!.createdAt = resp.body!.createdAt;
            this.isEditable = false;
          }
          if (resp.status === HttpStatusCode.BadRequest) {
            this.error_updatePost_message =
              'Post header or description invalid: very long or very short';
            setTimeout(() => (this.error_updatePost_message = undefined), 5000);
          }
          if (resp.status === HttpStatusCode.Unauthorized) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe((resp) => {
                if (
                  resp.status === HttpStatusCode.Ok &&
                  resp instanceof HttpResponse
                ) {
                  this.User!.token = resp.body!;
                  this.updatePost();
                }
              });
          }
        },
      });
  }

  public reactPost(isLike: boolean) {
    if (!this.User) {
      this._snackBar.open(
        'Plese authorize to react and see other post reactions',
        undefined,
        { duration: 7000 }
      );
      return;
    }
    if (
      this._authService.checkIsUserHaveAtLeastOneRole(this.User!, [
        'BannedUser',
      ])
    ) {
      this._snackBar.open(
        'You can not react to posts because you was banned',
        undefined,
        {
          duration: 7000,
        }
      );
      return;
    }

    this.disabled_likes = true;
    let reaction: reactionModel = {
      userId: this.User!.id,
      postId: this.Post!.id,
      isLike: isLike,
      id: undefined,
      reactedAt: undefined,
      commentId: undefined,
    };

    this._reactionService
      .reactToPost(reaction)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (resp.body) {
            let existReaction = this.postReactions.find(
              (pr) => pr.id === resp.body!.id
            );

            if (!existReaction) {
              this.postReactions.push(resp.body);
              this.reactionCount++;
              if (resp.body.isLike) {
                this.positiveReactionsCount++;
                this.likeStyle = { color: this.likeColor };
              } else this.dislikeStyle = { color: this.dislikeColor };
              return;
            }
            existReaction.isLike = !existReaction.isLike;

            if (existReaction.isLike) {
              this.positiveReactionsCount++;
              this.dislikeStyle = { color: this.whiteColor };
              this.likeStyle = { color: this.likeColor };
            } else {
              this.positiveReactionsCount--;
              this.dislikeStyle = { color: this.dislikeColor };
              this.likeStyle = { color: this.whiteColor };
            }
            return;
          }
          let deletedReaction = this.postReactions.find(
            (pr) =>
              pr.userId === reaction.userId && pr.postId === reaction.postId
          );
          let index = this.postReactions.indexOf(deletedReaction!);

          this.postReactions.splice(index, 1);
          this.reactionCount--;
          if (deletedReaction!.isLike) {
            this.likeStyle = { color: this.whiteColor };
            this.positiveReactionsCount--;
          } else this.dislikeStyle = { color: this.whiteColor };
        },
        error: (err) => {
          if (
            err instanceof HttpErrorResponse &&
            err.status === HttpStatusCode.Unauthorized
          ) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe({
                next: (resp) => {
                  if (
                    resp.status === HttpStatusCode.Ok &&
                    resp instanceof HttpResponse
                  ) {
                    this.User!.token = resp.body!;
                    this.reactPost(isLike);
                    return;
                  }
                },
                error: (err) => console.log(err),
              });
          }
        },
        complete: () => (this.disabled_likes = false),
      });
  }

  public openComments() {
    if (!this.User) {
      this._snackBar.open('Please authorize to read comments', undefined, {
        duration: 7000,
      });
      return;
    }
    if (
      this._authService.checkIsUserHaveAtLeastOneRole(this.User, ['BannedUser'])
    ) {
      this._snackBar.open(
        'You can not read comments because you was banned',
        undefined,
        {
          duration: 6000,
        }
      );
      return;
    }

    this.isOpenComments = !this.isOpenComments;
  }

  public addSingleComment() {
    let commentText = (
      document.getElementById(`comment${this.Post!.id}`) as HTMLInputElement
    ).value;
    if (!commentText || commentText.length < 2) {
      return;
    }

    let newComment: commentModel = {
      id: undefined,
      postId: this.Post!.id!,
      userId: this.User!.id,
      createdAt: undefined,
      commentText: commentText,
      commentId: undefined,
    };

    this._commentService
      .AddCommentToPost(newComment)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (
            resp instanceof HttpResponse &&
            resp.status === HttpStatusCode.Created
          ) {
            this.comments.push(resp.body!);
            this.isOpenSingleCommentContainer = false;
            return;
          }
          if (
            resp instanceof HttpErrorResponse &&
            resp.status === HttpStatusCode.Unauthorized
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
                  resp.status === HttpStatusCode.Ok
                ) {
                  this.User!.token = resp.body!;
                  this.addSingleComment();
                  return;
                }
                this._snackBar.open(
                  'You token is invalid, please re-login',
                  undefined,
                  {
                    duration: 7000,
                  }
                );
              });
          }
        },
      });
  }

  public openSingleCommentContainer() {
    this.isOpenSingleCommentContainer = !this.isOpenSingleCommentContainer;
  }

  public deleteCommentEvent(commentId:string){
    this.comments = this.comments.filter((c) => c.id !== commentId);
  }

  private getPostReactions() {
    if (this.User) {
      this._reactionService
        .getReactionByPostId(this.Post!.id!)
        .pipe(takeUntil(this.$unsubscribe))
        .subscribe({
          next: (resp) => {
            this.postReactions = resp.body!;
            this.reactionCount = resp.body!.length;
            this.positiveReactionsCount = resp.body!.filter(
              (r) => r.isLike
            ).length;
            let existReaction = this.postReactions.find(
              (pr) => pr.userId === this.User!.id
            );
            if (existReaction) {
              if (existReaction.isLike)
                this.likeStyle = { color: this.likeColor };
              else this.dislikeStyle = { color: this.dislikeColor };
            }
          },
          error: (err) => {
            console.log(err);
          },
        });
    }
  }

  private getComments() {
    if (this.User) {
      this._commentService
        .getCommentsByPostId(this.Post!.id!, 10)
        .pipe(takeUntil(this.$unsubscribe))
        .subscribe({
          next: (resp) => {
            this.comments = resp.body!;
          },
          error: (err) => console.log(err),
        });
    }
  }

  ngOnDestroy(): void {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }
}
