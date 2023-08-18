import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {RoleGuard} from '@app/guards/auth/role.guard';
import { NumberManComponent } from '@app/modules/client/numberman/numberman/numberman.component';

const routes: Routes = [
  {
    path: '',
    component: NumberManComponent,
    data: {title: 'Numbers Management'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class NumberManRouting {}
