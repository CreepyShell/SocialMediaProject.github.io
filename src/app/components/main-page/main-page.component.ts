import {
  HttpErrorResponse,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { postModel } from 'src/app/models/PostModel';
import { UserModel } from 'src/app/models/User/UserModel';
import { authService } from 'src/app/services/auth.service';
import { postService } from 'src/app/services/post.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css'],
})
export class MainPageComponent implements OnInit, OnDestroy {
  ngOnInit(): void {
    this.getAllPosts();
    this.getUserFromToken();
  }
  constructor(
    private _authService: authService,
    private _postService: postService,
    public snackBar: MatSnackBar
  ) {}
  public route: string = '';
  public Posts: postModel[] = [];
  public User: UserModel | undefined;
  public isLoadUser: boolean = false;
  public isLoadPosts: boolean = false;
  public isOpenCreatePost: boolean = false;
  public errorCreatePostMessage: string | undefined = undefined;
  public selectedPostTopic: string | undefined = undefined;
  private $unsubscribe = new Subject<void>();
  public GoToRegisterPage() {
    this.route = '/register';
  }
  public GoToLoginPage() {
    this.route = '/login';
  }

  public createPost() {
    let header: string = (
      document.getElementById('post-header') as HTMLInputElement
    ).value!;
    let text: string = (
      document.getElementById('description') as HTMLInputElement
    ).value!;

    if (!header || !text || !this.selectedPostTopic) {
      this.errorCreatePostMessage = 'all fields must be filled';
      setTimeout(() => {
        this.errorCreatePostMessage = undefined;
      }, 5000);
      return;
    }

    let newPost: postModel = {
      id: undefined,
      userId: this.User!.id,
      postTopic: this.selectedPostTopic!,
      header: header,
      text: text,
      commentIds: [],
      reactionIds: [],
      updatedAt: undefined,
      createdAt: undefined,
    };

    this._postService
      .createPost(newPost)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (
            resp instanceof HttpResponse &&
            resp.status === HttpStatusCode.Ok
          ) {
            this.Posts.push(resp.body!);
            this.isOpenCreatePost = false;
            this.sortPosts();
            return;
          }
          if (
            resp.status === HttpStatusCode.BadRequest &&
            resp instanceof HttpErrorResponse
          ) {
            this.errorCreatePostMessage = resp.error;
            setTimeout(() => (this.errorCreatePostMessage = undefined), 5000);
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
                    this.createPost();
                    return;
                  }
                },
                error: (err) => console.log(err),
              });
            return;
          }
        },
        error: (err) => console.log(err),
      });
  }

  public openCreatePostContainer() {
    if (this.isOpenCreatePost) {
      this.isOpenCreatePost = false;
      return;
    }
    if (
      this.User &&
      this._authService.checkIsUserHaveAtLeastOneRole(this.User, [
        'User',
        'PremiumUser',
        'Administrator',
        'Owner',
      ])
    ) {
      this.isOpenCreatePost = true;
      return;
    }
    if (
      this.User &&
      this._authService.checkIsUserHaveAtLeastOneRole(this.User, ['BannedUser'])
    ) {
      this.snackBar.open(
        'You was banned, so you can not create discussions',
        undefined,
        {
          duration: 5000,
          panelClass: ['snackbar-main-page'],
        }
      );
      return;
    }
    this.snackBar.open('please authorize to create discussions', undefined, {
      duration: 5000,
      panelClass: ['snackbar-main-page'],
    });
  }

  private getAllPosts() {
    this._postService
      .getAllPosts()
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe((resp) => {
        if (resp instanceof HttpResponse) {
          this.Posts = resp.body!;
          this.sortPosts();
          this.isLoadPosts = true;
          return;
        }
      });
  }

  private sortPosts() {
    this.Posts = this.Posts.sort((a, b) => {
      return (
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
    });
  }
  private getUserFromToken() {
    let accessToken: string | null =
      this._authService.getAccessTokenFromLocalStorage();
    let refreshToken: string | null =
      this._authService.getRefreshTokenFromLocalStorage();

    if (!accessToken || this.User || !refreshToken) {
      this.isLoadUser = true;
      return;
    }

    this._authService
      .getUserFromToken()!
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (!(resp instanceof HttpErrorResponse)) {
            this.User = resp! as UserModel;
            this.User.token = {
              accessToken: accessToken!,
              refreshToken: refreshToken!,
            };
            this.isLoadUser = true;
            return;
          } else if (
            (resp as HttpErrorResponse).status === HttpStatusCode.Unauthorized
          ) {
            this._authService
              .refreshToken(refreshToken!, accessToken!)
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe({
                next: (resp) => {
                  if (resp.status === HttpStatusCode.Ok) {
                    this.getUserFromToken();
                  } else {
                    this.isLoadUser = true;
                    this._authService.setTokenInLocalStorage('', '');
                    this.snackBar.open(
                      'You token invalid, please re-login',
                      undefined,
                      {
                        duration: 5000,
                      }
                    );
                  }
                },
              });
          }
        },
      });
  }

  public deletePostEvent(postId: string) {
    this.Posts = this.Posts.filter((p) => p.id !== postId);
  }

  ngOnDestroy(): void {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }
}
