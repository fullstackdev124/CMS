import { AuthGuard } from '@app/guards/auth/auth.guard';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RoleGuard } from '@app/guards/auth/role.guard';
import {BillingComponent} from "@app/modules/client/billing/billing/billing.component";
import {BillingSettingsComponent} from "@app/modules/client/billing/billing-settings/billing-settings.component";
import {BillingPaymentAddComponent} from "@app/modules/client/billing/billing-payment-add/billing-payment-add.component";

const routes: Routes = [
  {
    path: '',
    component: BillingComponent,
    data: {title: 'Billing'},
    pathMatch: 'full',
    canActivate: [RoleGuard]
  },
  {
    path: 'settings',
    component: BillingSettingsComponent,
    data: {title: 'Billing Settings'},
    pathMatch: 'full',
    canActivate: [RoleGuard]
  },
  {
    path: 'payment_method/add',
    component: BillingPaymentAddComponent,
    data: {title: 'Add Credit Card'},
    pathMatch: 'full',
    canActivate: [RoleGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class BillingRouting {}
