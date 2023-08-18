import {NgxStripeModule, STRIPE_PUBLISHABLE_KEY, StripeService} from 'ngx-stripe';
import { BrowserModule } from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { OverlayModule } from '@angular/cdk/overlay';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService } from '@services/api/api.service';
import { StoreService } from '@services/store/store.service';
import { PopupService } from '@services/popup/popup.service';
import { StatusInterceptor, TokenInterceptor } from './services/middlewares';
import { PopupComponent } from '@components/popup/popup.component';
import { ClientComponent } from '@app/modules/client/client.component';
import { LayoutService } from "@services/app.layout.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {MenuService} from "@services/app.menu.service";
import {ToastModule} from "primeng/toast";

import {AuthComponent} from "@app/modules/auth/auth.component";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {EnvironmentLoaderService} from "@services/environment-loader.service";
import { environment } from '@env/environment';
export const config = Object.freeze(environment);

declare module "@angular/core" {
  interface ModuleWithProviders<T = any> {
    ngModule: Type<T>;
    providers?: Provider[];
  }
}

const initAppFn = (envService: EnvironmentLoaderService, apiService: ApiService) => {
  return async () => {
    return new Promise(async (resolve) => {
      await envService.loadEnvConfig('assets/config/config.json')
      const env = envService.getEnvConfig()
      if (env)
        await apiService.setBasePath(env)
      resolve()
    })
  }
};

// const stripeFactory = (envService: EnvironmentLoaderService): string => {
//   const env = envService.getEnvConfig()
//   return env?.stripe.key
// }

@NgModule({
  declarations: [
    AppComponent,
    PopupComponent,
    ClientComponent,
    AuthComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    OverlayModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    ToastModule,
    BrowserAnimationsModule,
    NgxStripeModule.forRoot(config.stripe.key),
    RippleModule,
    ButtonModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initAppFn,
      multi: true,
      deps: [EnvironmentLoaderService, ApiService],
    },
		{
			provide: HTTP_INTERCEPTORS,
			useClass: StatusInterceptor,
			multi: true
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: TokenInterceptor,
			multi: true
		},
    /*
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    }
    {
      provide: STRIPE_PUBLISHABLE_KEY,
      useValue: config.stripe.key
    }
    */

    EnvironmentLoaderService,
    ApiService,
    // {
    //   provide: STRIPE_PUBLISHABLE_KEY,
    //   useFactory: stripeFactory,
    //   deps: [EnvironmentLoaderService],
    // },
    StoreService,
    PopupService,
    LayoutService,
    MenuService,
    MessageService,
	],
	entryComponents: [
		PopupComponent
	],
  bootstrap: [AppComponent]
})

export class AppModule { }
