import { HttpErrorResponse, HttpRequest, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';
import { AuthUserModel } from 'src/app/models/User/AuthUserModel';
import { authService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  faNotShowPass = faEyeSlash;
  faShowPass = faEye;
  public isUsernameChosen: boolean = true;
  public selectedValue: string = 'username';
  public showpassword: boolean = false;
  public errorMessage: string | undefined = undefined;
  public disableButton: boolean = false;
  private $unsubscribe = new Subject<void>();

  constructor(private route: Router, private _authService: authService) {}
  ngOnInit(): void {}

  public onValChange(val: string) {
    this.selectedValue == val;
    if (val == 'email') {
      this.isUsernameChosen = false;
      return;
    }
    this.isUsernameChosen = true;
  }

  public login() {
    this.disableButton = true;

    let username: string | null = (
      document.getElementById('username') as HTMLInputElement
    )?.value;
    let email: string | null = (
      document.getElementById('mail') as HTMLInputElement
    )?.value;
    let password: string = (document.getElementById('pass') as HTMLInputElement)
      .value;

      let authUser:AuthUserModel = {
        password: password,
        username: username,
        email: email,
      }

    this._authService
      .loginUser(authUser)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe({
        next: (resp) => {
          if (resp instanceof HttpResponse) {
            this.route.navigate(['/']);
          } else {
            if (resp.status == HttpStatusCode.NotFound) {
              this.errorMessage = this.isUsernameChosen
                ? 'Did not find user with this username'
                : 'Did not find user with this email';
            }
            if (resp.status == HttpStatusCode.BadRequest) {
              this.errorMessage = (resp as HttpErrorResponse).error;
            }
            if (resp.status == HttpStatusCode.NotAcceptable) {
              this.errorMessage = (resp as HttpErrorResponse).error;
            }
            setTimeout(() => (this.errorMessage = undefined), 10000);
            setTimeout(() => (this.disableButton = false), 1000);
          }
        },
        error: (err) => console.log(err),
      });
  }

  public showPassword() {
    this.showpassword = !this.showpassword;
    let el = document.getElementById('pass') as HTMLInputElement;
    if (el!.type === 'password') {
      el!.type = 'text';
    } else {
      el!.type = 'password';
    }
  }
  ngOnDestroy(): void {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }
}
