import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserModel } from 'src/app/models/User/UserModel';
import { authService } from 'src/app/services/auth.service';
import { userService } from 'src/app/services/user.service';

@Component({
  selector: 'app-logged-in-error',
  templateUrl: './logged-in-error.component.html',
  styleUrls: ['./logged-in-error.component.css'],
})
export class LoggedInErrorComponent implements OnInit, OnDestroy {
  constructor(
    private _authService: authService,
    private _userService: userService,
    private router: Router
  ) {}
  private $unsubscribe = new Subject<void>();
  private User: UserModel | undefined;
  ngOnInit(): void {
    if (
      this._authService.getAccessTokenFromLocalStorage() &&
      this._authService.getRefreshTokenFromLocalStorage()
    ) {
      this._authService
        .getUserFromToken()!
        .pipe(takeUntil(this.$unsubscribe))
        .subscribe((resp) => {
          if (!(resp instanceof HttpErrorResponse)) {
            this.User = resp;
            this.User.token = {
              accessToken: this._authService.getAccessTokenFromLocalStorage()!,
              refreshToken:
                this._authService.getRefreshTokenFromLocalStorage()!,
            };
          }
        });
    }
  }
  public logOut() {
    this._authService.setTokenInLocalStorage('', '');
    if (this.User) {
      this._authService
        .logout(this.User)
        .pipe(takeUntil(this.$unsubscribe))
        .subscribe({
          next: () => {
            this.User = undefined;
          },
          error: (err) => console.log(err),
        });
    }
    this.router.navigate(['/']);
  }
  ngOnDestroy(): void {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }
}
