import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedInErrorComponent } from './components/logged-in-error/logged-in-error.component';
import { LoginComponent } from './components/login/login.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { RegisterComponent } from './components/register/register.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { authorizedGuard, nonAuthorizedGuard } from './guards/authGuard';

const routes: Routes = [
  { path: '', component: MainPageComponent },
  {
    path: 'register',
    component: RegisterComponent,
    pathMatch: 'full',
    canActivate: [authorizedGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    pathMatch: 'full',
    canActivate: [authorizedGuard],
  },
  { path: 'profile', component: UserProfileComponent, pathMatch: 'full',canActivate:[] },
  {
    path: 'loggedError',
    component: LoggedInErrorComponent,
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
