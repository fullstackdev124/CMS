import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {ReportActivityComponent} from '@app/modules/client/reports/report-activity/report-activity.component';
import {ReportOverviewComponent} from '@app/modules/client/reports/report-overview/report-overview.component';
import {RoleGuard} from '@app/guards/auth/role.guard';

const routes: Routes = [
  {
    path: 'activity',
    component: ReportActivityComponent,
    data: {title: 'Activity Reports'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
  {
    path: 'overview',
    component: ReportOverviewComponent,
    data: {title: 'Reports Overview'},
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ReportsRouting {}
