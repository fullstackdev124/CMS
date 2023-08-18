import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { ErrorPage2Component } from './error-page2/error-page2.component';
import { SignupComponent } from "@app/modules/auth/signup/signup.component";
import {AccountActivateComponent} from "@app/modules/auth/account-activate/account-activate.component";
import {AuthComponent} from "@app/modules/auth/auth.component";

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    data: {title: ''},
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: LoginComponent,
        data: { title: ':: eCMS :: Log In' }
      },
      {
        path: 'signup',
        component: SignupComponent,
        data: { title: ':: eCMS :: Sign Up' }
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        data: { title: ':: eCMS :: Forgot Password' }
      },
      {
        path: 'account-activate',
        component: AccountActivateComponent,
        data: { title: ':: eCMS :: Activate Account' }
      },
      {
        path: 'error-404',
        component: ErrorPageComponent,
        data: { title: ':: eCMS :: Error-404' }
      },
      {
        path: 'error-500',
        component: ErrorPage2Component,
        data: { title: ':: eCMS :: Error-500' }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class AuthRoutingModule {
}
