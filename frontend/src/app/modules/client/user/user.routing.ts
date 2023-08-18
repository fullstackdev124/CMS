import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {UsersComponent} from '@app/modules/client/user/users/users.component';
import {UserAddComponent} from '@app/modules/client/user/user-add/user-add.component';
import {UserEditComponent} from '@app/modules/client/user/user-edit/user-edit.component';
import {UserDeleteComponent} from '@app/modules/client/user/user-delete/user-delete.component';
import {RoleGuard} from '@app/guards/auth/role.guard';

const routes: Routes = [
    {
      path: '',
      component: UsersComponent,
      data: {title: 'Users'},
      pathMatch: 'full',
      canActivate: [RoleGuard],
    },
    {
      path: 'add',
      component: UserAddComponent,
      data: {title: 'New User'},
      pathMatch: 'full',
      canActivate: [RoleGuard],
    },
    {
      path: 'edit/:id',
      component: UserEditComponent,
      data: {title : 'User Edit'},
      pathMatch: 'full',
      canActivate: [RoleGuard],
    },
    {
      path: 'delete/:id',
      component: UserDeleteComponent,
      data: {title : 'User Remove'},
      pathMatch: 'full',
      canActivate: [RoleGuard],
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class UserRoutingModule {}
