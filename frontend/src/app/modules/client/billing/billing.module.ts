import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountToModule } from 'angular-count-to';

import { BillingComponent } from '@app/modules/client/billing/billing/billing.component';
import { BillingRouting } from '@app/modules/client/billing/billing.routing';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from "primeng/button"
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { NgxStripeModule } from 'ngx-stripe';
import {TabViewModule} from "primeng/tabview";
import { PanelModule } from 'primeng/panel';
import {InputTextModule} from "primeng/inputtext";
import {DropdownModule} from "primeng/dropdown";
import { BillingSettingsComponent } from './billing-settings/billing-settings.component';
import {InputMaskModule} from "primeng/inputmask";
import {PaginatorModule} from "primeng/paginator";
import { BillingPaymentAddComponent } from './billing-payment-add/billing-payment-add.component';
import {TooltipModule} from "primeng/tooltip";
import {PasswordModule} from "primeng/password";
import {TextMaskModule} from "angular2-text-mask";
import {MessageModule} from "primeng/message";
import {BlockUIModule} from "primeng/blockui";
import {environment} from "@env/environment";

export const config = Object.freeze(environment);

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        CountToModule,
        BillingRouting,
        TableModule,
        ButtonModule,
        DialogModule,
        InputNumberModule,
        AutoCompleteModule,
        ConfirmDialogModule,
        NgxStripeModule.forRoot(config.stripe.key),
        TabViewModule,
        PanelModule,
        InputTextModule,
        DropdownModule,
        InputMaskModule,
        TooltipModule,
        PaginatorModule,
        TextMaskModule,
        PasswordModule,
        MessageModule,
        BlockUIModule,
    ],
  providers: [
  /*
    {
      provide: STRIPE_PUBLISHABLE_KEY,
      useValue: config.stripe.key
    }
  */
  ],
  declarations: [
    BillingComponent,
    BillingSettingsComponent,
    BillingPaymentAddComponent,
  ]
})

export class BillingModule { }
