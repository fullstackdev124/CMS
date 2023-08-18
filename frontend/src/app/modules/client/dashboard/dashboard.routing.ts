import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {DashboardComponent} from '@app/modules/client/dashboard/dashboard.component';
import {RoleGuard} from '@app/guards/auth/role.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: {title: 'Dashboard'},
    pathMatch: 'full',
    canActivate: [RoleGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class DashboardRouting {}
