import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {TrackingSourcesComponent} from '@app/modules/client/tracking-source/tracking-sources/tracking-sources.component';
import {TrackingSourceNewComponent} from '@app/modules/client/tracking-source/tracking-source-new/tracking-source-new.component';
import {TrackingSourceEditComponent} from '@app/modules/client/tracking-source/tracking-source-edit/tracking-source-edit.component';
import {TrackingSourceDeleteComponent} from '@app/modules/client/tracking-source/tracking-source-delete/tracking-source-delete.component';
import {RoleGuard} from '@app/guards/auth/role.guard';

const routes: Routes = [
  {
    path: '',
    component: TrackingSourcesComponent,
    data: {title: 'Tracking Sources'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'add',
    component: TrackingSourceNewComponent,
    data: {title: 'New Tracking Source'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'edit/:id',
    component: TrackingSourceEditComponent,
    data: {title: 'Edit Tracking Source'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'delete/:id',
    component: TrackingSourceDeleteComponent,
    data: {title: 'Delete Tracking Source'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class TrackingSourceRouting {}
