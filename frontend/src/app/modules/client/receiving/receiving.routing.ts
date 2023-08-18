import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {ReceivingNumbersComponent} from '@app/modules/client/receiving/receiving-numbers/receiving-numbers.component';
import {ReceivingAddComponent} from '@app/modules/client/receiving/receiving-add/receiving-add.component';
import {ReceivingEditComponent} from '@app/modules/client/receiving/receiving-edit/receiving-edit.component';
import {ReceivingDeleteComponent} from '@app/modules/client/receiving/receiving-delete/receiving-delete.component';
import {RoleGuard} from '@app/guards/auth/role.guard';

const routes: Routes = [
  {
    path: '',
    component: ReceivingNumbersComponent,
    data: {title: 'Receiving Numbers'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'add',
    component: ReceivingAddComponent,
    data: {title: 'New Receiving Number'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'edit/:id',
    component: ReceivingEditComponent,
    data: {title: 'Edit Receiving Number'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'delete/:id',
    component: ReceivingDeleteComponent,
    data: {title: 'Remove Receiving Number'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ReceivingRouting {}
