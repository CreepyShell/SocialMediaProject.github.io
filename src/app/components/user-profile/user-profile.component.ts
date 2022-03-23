import {
  HttpErrorResponse,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { iif, of, Subject, switchMap, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserModel } from 'src/app/models/User/UserModel';
import { Token } from 'src/app/models/User/Token';
import { authService } from 'src/app/services/auth.service';
import { userService } from 'src/app/services/user.service';
import {
  faArrowLeft,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { updatedUserModel } from 'src/app/models/User/UpdatedUserModel';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  constructor(
    private _authService: authService,
    private _userService: userService,
    private router: Router
  ) {}
  faArrowLeft = faArrowLeft;
  faShowPass = faEye;
  faNotShowPass = faEyeSlash;
  public loadUser: boolean = false;
  public showSecuritySettings = false;
  public User!: UserModel;
  public isEdit: boolean = false;
  public showCurrentPassword: boolean = false;
  public showNewPassword: boolean = false;
  public errorMessage: string | undefined = undefined;
  public resultMessage: string | undefined = undefined;
  public errorCodeMessage: string | undefined = undefined;
  public resultCodeMessage: string | undefined = undefined;
  public errorUpdateUser: string | undefined = undefined;
  public disableButton: boolean = false;
  private $unsubscribe = new Subject<void>();
  ngOnInit(): void {
    this._authService
      .getUser()
      ?.pipe(takeUntil(this.$unsubscribe))
      .subscribe((resp) => {
        if (!(resp instanceof HttpErrorResponse)) {
          this.User = resp;
          this.User.token = {
            refreshToken: this._authService.getRefreshTokenFromLocalStorage()!,
            accessToken: this._authService.getRefreshTokenFromLocalStorage()!,
          };
          this.loadUser = true;
        } else if (
          (resp as HttpErrorResponse) &&
          (resp as HttpErrorResponse).status === HttpStatusCode.Unauthorized
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
                this.ngOnInit();
              } else this._authService.setTokenInLocalStorage('', '');
            });
        }
      });
  }

  public divideUserName(index: number): string {
    this.User?.fullName.split(' ')[index];
    return this.User?.fullName.split(' ')[index] ?? '';
  }

  public goBack() {
    this.router.navigate(['/']);
  }

  public openSecuritySettings() {
    this.showSecuritySettings = !this.showSecuritySettings;
  }

  public edit() {
    this.isEdit = !this.isEdit;
  }

  public LogOut() {
    if (this.User) {
      this._authService
        .logout(this.User)
        .pipe(takeUntil(this.$unsubscribe))
        .subscribe((resp) => {
          this._authService.setTokenInLocalStorage('', '');
          if (resp.status === HttpStatusCode.Ok) {
            this.router.navigate(['/']);
            return;
          }
          alert('something went wrong please re-login');
        });
    }
  }

  public changePassword() {
    let currentPassEl = document.getElementById(
      'password'
    )! as HTMLInputElement;
    let newPassEl = document.getElementById(
      'new-password'
    )! as HTMLInputElement;

    if (!currentPassEl.value || !newPassEl.value) {
      this.resultMessage = undefined;
      this.errorMessage = 'passwords can not be empty';
      setTimeout(() => (this.errorMessage = undefined), 5000);
      return;
    }
    this.disableButton = true;
    this._userService
      .changePass(currentPassEl.value, newPassEl.value)
      .pipe(
        switchMap((resp) => {
          return iif(
            () => resp.status === HttpStatusCode.Unauthorized,
            this._authService.refreshToken(
              this._authService.getRefreshTokenFromLocalStorage()!,
              this._authService.getAccessTokenFromLocalStorage()!
            ),
            of(resp).pipe(
              map((resp) => {
                if (resp instanceof HttpErrorResponse) {
                  return resp;
                }
                return resp.body;
              })
            )
          );
        }),
        switchMap((resp) => {
          return iif(
            () =>
              resp instanceof HttpResponse && resp.status === HttpStatusCode.Ok,
            this._userService
              .changePass(currentPassEl.value, newPassEl.value)
              .pipe(
                map((resp) => {
                  return (resp as HttpResponse<Token>).body;
                })
              ),
            of(resp)
          );
        }),
        takeUntil(this.$unsubscribe)
      )
      .subscribe({
        next: (resp) => {
          if (resp instanceof HttpErrorResponse) {
            if (resp.status === HttpStatusCode.BadRequest) {
              this.resultMessage = undefined;
              this.errorMessage = 'current password incorect or new is invalid';
              setTimeout(() => {
                this.errorMessage = undefined;
                this.disableButton = false;
              }, 5000);
              return;
            }
          }
          this.User.token = resp as Token;
          this.errorMessage = undefined;
          this.resultMessage = 'password successfully changed';
          currentPassEl.value = '';
          newPassEl.value = '';
          setTimeout(() => {
            this.disableButton = false;
            this.resultMessage = undefined;
          }, 10000);
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  public sumbitEditedProfile() {
    this.UpdateUserLocaly(this.getUpdatedUser());
    this._userService
      .updateUser(this.User)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe((resp) => {
        if (resp instanceof HttpErrorResponse) {
          if (resp.status === HttpStatusCode.Unauthorized) {
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(takeUntil(this.$unsubscribe))
              .subscribe((resp) => {
                if (resp instanceof HttpResponse) {
                  this.User.token = resp.body!;
                  this.sumbitEditedProfile();
                }
              });
            return;
          } else if (resp.status === HttpStatusCode.BadRequest) {
            this.errorUpdateUser = resp.error;
            setTimeout(() => {
              this.errorUpdateUser = undefined;
            }, 10000);
          }
          return;
        }
        this.errorUpdateUser = undefined;
        this.isEdit = false;
        this.User.age = resp.body!.age;
        this.User.birthDay = resp.body!.birthDay!;
        this.User.bio = resp.body!.bio;
        this.User.fullName = resp.body!.fullName;
        this.User.registeredAt = resp.body!.registeredAt;
      });
  }

  public showCurrentPass() {
    this.showCurrentPassword = !this.showCurrentPassword;
    let el = document.getElementById('password') as HTMLInputElement;
    if (el!.type === 'password') {
      el!.type = 'text';
    } else {
      el!.type = 'password';
    }
  }

  public showNewPass() {
    this.showNewPassword = !this.showNewPassword;
    let el = document.getElementById('new-password') as HTMLInputElement;
    if (el!.type === 'password') {
      el!.type = 'text';
    } else {
      el!.type = 'password';
    }
  }

  public updateCodeWord() {
    let word = document.getElementById('new-code-words') as HTMLInputElement;
    if (!word.value || word.value.length < 5 || word.value.length > 100) {
      this.resultCodeMessage = undefined;
      this.errorCodeMessage =
        'code words can be empty or less then 5 and longer than 100 symbols';
      setTimeout(() => (this.errorCodeMessage = undefined), 5000);
      return;
    }

    this._userService
      .changeCodeWords(word.value, this.User)
      .pipe(
        switchMap((resp) => {
          return iif(
            () => resp.status === HttpStatusCode.Unauthorized,
            this._authService
              .refreshToken(
                this._authService.getRefreshTokenFromLocalStorage()!,
                this._authService.getAccessTokenFromLocalStorage()!
              )
              .pipe(
                map((resp) => {
                  this.User.token = (resp as HttpResponse<Token>).body!;
                  return resp;
                })
              ),
            of(resp.status)
          );
        }),
        switchMap((resp) => {
          return iif(
            () =>
              resp instanceof HttpResponse && resp.status === HttpStatusCode.Ok,
            this._userService.changeCodeWords(word.value, this.User),
            of(resp)
          );
        }),
        takeUntil(this.$unsubscribe)
      )
      .subscribe({
        next: () => {
          this.errorCodeMessage = undefined;
          this.resultCodeMessage = 'code words successfuly updated';
          setTimeout(() => (this.resultCodeMessage = undefined), 10000);
          word.value = '';
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  public deleteProfile() {
    this._userService
      .deleteUser(this.User)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (
            resp.status === HttpStatusCode.Ok &&
            resp instanceof HttpResponse &&
            resp.body
          ) {
            this.router.navigate(['/']);
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
                  resp instanceof HttpResponse &&
                  resp.status === HttpStatusCode.Ok
                ) {
                  this.User.token = resp.body!;
                  this.deleteProfile();
                }
              });
          }
        },
        error: (err) => console.log(err),
      });
  }

  public getBirthday() {
    let resDate: string = '';
    if (this.User.birthDay) {
      let date: Date = new Date(this.User.birthDay!);
      let mounth =
        (date.getMonth() + 1).toString().length === 1
          ? '0' + (date.getMonth() + 1).toString()
          : (date.getMonth() + 1).toString();

      let day =
        date.getDate().toString().length === 1
          ? '0' + date.getDate().toString()
          : date.getDate().toString();
      resDate = `${date.getUTCFullYear()}-${mounth}-${day}`;
    }
    return resDate;
  }

  private getUpdatedUser(): updatedUserModel {
    let newName = (document.getElementById('name') as HTMLInputElement).value;
    let newSurname = (document.getElementById('surname') as HTMLInputElement)
      .value;
    let newBirthday = Date.parse(
      (document.getElementById('birthday') as HTMLInputElement).value
    );
    let newBio = (document.getElementById('bio') as HTMLInputElement).value;
    let newAva = (document.getElementById('ava-url') as HTMLInputElement).value;
    return {
      fullName: `${newName} ${newSurname}`,
      birthDay: isNaN(newBirthday) ? null : new Date(newBirthday),
      bio: newBio,
      avatar: newAva,
    };
  }

  private UpdateUserLocaly(updatedUser: updatedUserModel) {
    if (updatedUser.birthDay) {
      this.User.age ==
        new Date().getFullYear() - updatedUser.birthDay.getFullYear();
      this.User.birthDay! = updatedUser.birthDay;
    }
    if (updatedUser.bio) {
      this.User.bio = updatedUser.bio;
    }
    if (updatedUser.fullName) {
      this.User.fullName = updatedUser.fullName;
    }
    if (updatedUser.avatar) {
      this.User.avatar = updatedUser.avatar;
    }
  }

  ngOnDestroy(): void {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }
}
