import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { AuthUserModel } from 'src/app/models/User/AuthUserModel';
import { UserModel } from 'src/app/models/User/UserModel';
import { authService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  public authUser: UserModel | undefined = undefined;
  public showpassword: boolean = false;
  public show_confpassword: boolean = false;
  public errorMessage: string | undefined = undefined;
  public disableButton: boolean = false;

  ngOnInit(): void {}
  faNotShowPass = faEyeSlash;
  faShowPass = faEye;
  constructor(private _authService: authService, private route: Router) {}
  private $unsubscribe = new Subject<void>();
  public register() {
    let authUser: AuthUserModel | undefined = this.getRegisterUser();
    if (authUser === undefined) {
      return;
    }
    this.disableButton = true;
    this._authService
      .registerUser(authUser!)
      .pipe(takeUntil(this.$unsubscribe))
      .subscribe((resp) => {
        if (resp instanceof HttpResponse) {
          this.route.navigate(['/']);
        }
        this.errorMessage = (resp as HttpErrorResponse).error;
        setTimeout(() => (this.errorMessage = undefined), 10000);
        setTimeout(() => (this.disableButton = false), 1000);
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
  private getRegisterUser(): AuthUserModel | undefined {
    let username: string = (
      document.getElementById('username') as HTMLInputElement
    )?.value;
    let email: string = (document.getElementById('mail') as HTMLInputElement)
      ?.value;
    let password: string = (document.getElementById('pass') as HTMLInputElement)
      .value;
    let confirmPassword: string = (
      document.getElementById('confirm-pass') as HTMLInputElement
    ).value;

    if (!email || !password || !username) {
      this.errorMessage = 'All fields must be filled';
      setTimeout(() => {
        this.errorMessage = undefined;
      }, 10000);
      return undefined;
    }

    if (password !== confirmPassword) {
      this.errorMessage = 'Password mismatch';
      setTimeout(() => {
        this.errorMessage = undefined;
      }, 10000);
      return undefined;
    }

    return {
      email: email,
      password: password,
      username: username,
    };
  }
  public showConfPassword() {
    this.show_confpassword = !this.show_confpassword;
    let el = document.getElementById('confirm-pass') as HTMLInputElement;
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
