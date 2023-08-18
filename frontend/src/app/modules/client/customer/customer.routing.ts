import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {CustomersComponent} from '@app/modules/client/customer/customers/customers.component';
import {CustomerAddComponent} from '@app/modules/client/customer/customer-add/customer-add.component';
import {CustomerEditComponent} from '@app/modules/client/customer/customer-edit/customer-edit.component';
import {CustomerDeleteComponent} from '@app/modules/client/customer/customer-delete/customer-delete.component';
import {RoleGuard} from '@app/guards/auth/role.guard';

const routes: Routes = [
  {
    path: '',
    component: CustomersComponent,
    data: {title: 'Customers'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'add',
    component: CustomerAddComponent,
    data: {title: 'New Customer'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'edit/:id',
    component: CustomerEditComponent,
    data: {title : 'Edit Customer'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'delete/:id',
    component: CustomerDeleteComponent,
    data: {title : 'Remove Customer'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class CustomerRouting {}
