import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { ErrorPage2Component } from './error-page2/error-page2.component';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AccountActivateComponent } from './account-activate/account-activate.component';
import { SignupComponent } from './signup/signup.component';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';

import {RippleModule} from "primeng/ripple";
import {DropdownModule} from "primeng/dropdown";
import {NgxStripeModule} from "ngx-stripe";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {StepsModule} from "primeng/steps";
import {CarouselModule} from "primeng/carousel";
import {BlockUIModule} from "primeng/blockui";
import {InputMaskModule} from "primeng/inputmask";
// import { environment } from '@env/environment';
// export const config = Object.freeze(environment);

@NgModule({
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    PasswordModule,
    RippleModule,
    DropdownModule,
    CarouselModule,
    StepsModule,
    NgxStripeModule,
    ProgressSpinnerModule,
    BlockUIModule,
    InputMaskModule,
  ],
  declarations: [
    LoginComponent,
    ForgotPasswordComponent,
    ErrorPageComponent,
    ErrorPage2Component,
    AccountActivateComponent,
    SignupComponent
  ],
  providers: [
  /*
    {
      provide: STRIPE_PUBLISHABLE_KEY,
      useValue: config.stripe.key
    }
  */
  ]
})
export class AuthModule { }
