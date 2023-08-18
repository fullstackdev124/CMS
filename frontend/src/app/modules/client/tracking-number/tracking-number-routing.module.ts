import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {TrackingComponent} from '@app/modules/client/tracking-number/tracking/tracking.component';
import {TrackingEditComponent} from '@app/modules/client/tracking-number/tracking-edit/tracking-edit.component';
import {TrackingDeleteComponent} from '@app/modules/client/tracking-number/tracking-delete/tracking-delete.component';
import {TrackingAddComponent} from '@app/modules/client/tracking-number/tracking-add/tracking-add.component';
import {RoleGuard} from '@app/guards/auth/role.guard';
import {TrackingSetupComponent} from "@app/modules/client/tracking-number/setup/tracking.setup.component";


const routes: Routes = [
  {
    path: '',
    component: TrackingComponent,
    data: {title: 'Tracking Numbers'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'setup',
    component: TrackingSetupComponent,
    data: {title: 'Tracking Numbers > Setup'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'add',
    component: TrackingAddComponent,
    data: {title: 'Add New Tracking Number'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'edit/:id',
    component: TrackingEditComponent,
    data: {title: 'Edit Tracking Number'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'delete/:id',
    component: TrackingDeleteComponent,
    data: {title: 'Remove Tracking Number'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrackingNumberRoutingModule { }
