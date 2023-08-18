import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {RolesComponent} from '@app/modules/client/role/roles/roles.component';
import {RoleAddComponent} from '@app/modules/client/role/role-add/role-add.component';
import {RoleEditComponent} from '@app/modules/client/role/role-edit/role-edit.component';
import {RoleDeleteComponent} from '@app/modules/client/role/role-delete/role-delete.component';
import {RoleGuard} from '@app/guards/auth/role.guard';

const routes: Routes = [
  {
    path: '',
    component: RolesComponent,
    data: {title: 'Roles'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'add',
    component: RoleAddComponent,
    data: {title: 'Add Role'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'edit/:id',
    component: RoleEditComponent,
    data: {title: 'Edit Role'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'delete/:id',
    component: RoleDeleteComponent,
    data: {title : 'Role Remove'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class RoleRouting {}
