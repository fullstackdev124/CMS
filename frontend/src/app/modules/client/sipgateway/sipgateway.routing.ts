import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {SipGatewaysComponent} from '@app/modules/client/sipgateway/sipgateway/sipgateway.component';
import {SipGatewayAddComponent} from '@app/modules/client/sipgateway/sipgateway-add/sipgateway-add.component';
import {SipGatewayEditComponent} from '@app/modules/client/sipgateway/sipgateway-edit/sipgateway-edit.component';
import {SipGatewayDeleteComponent} from '@app/modules/client/sipgateway/sipgateway-delete/sipgateway-delete.component';
import {RoleGuard} from '@app/guards/auth/role.guard';
import {SipgatewayOrderComponent} from "@app/modules/client/sipgateway/sipgateway-order/sipgateway-order.component";

const routes: Routes = [
  {
    path: '',
    component: SipGatewaysComponent,
    data: {title: 'Sip Gateways'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'order',
    component: SipgatewayOrderComponent,
    data: {title: 'Assign Order of Sip Gateway'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'add',
    component: SipGatewayAddComponent,
    data: {title: 'New Sip Gateway'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'edit/:id',
    component: SipGatewayEditComponent,
    data: {title: 'Edit Sip Gateway'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'delete/:id',
    component: SipGatewayDeleteComponent,
    data: {title: 'Remove Sip Gateway'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SipGatewayRouting {}
