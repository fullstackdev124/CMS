import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from '@app/modules/client/layout/layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    data: { title: '' },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
        data: { title: 'Dashboard', guiSection: 'Dashboard'},
      },
      {
        path: 'call-log',
        loadChildren: () => import('./call-logs/call-logs.module').then(m => m.CallLogsModule),
        data: { title: 'Call Logs', guiSection: 'CallLogs'},
      },
      {
        path: 'user',
        loadChildren: () => import('./user/user.module').then(m => m.UserModule),
        data: {title: 'User Management', guiSection: 'SystemSettings'},
      },
      {
        path: 'billing',
        loadChildren: () => import('./billing/billing.module').then(m => m.BillingModule),
        data: {title: 'Billing Management', guiSection: 'SystemSettings'},
      },
      {
        path: 'routing/receiving',
        loadChildren: () => import('./receiving/receiving.module').then(m => m.ReceivingModule),
        data: {title: 'Receiving Numbers Management'},
      },
      {
        path: 'routing/sipgateway',
        loadChildren: () => import('./sipgateway/sipgateway.module').then(m => m.SipGatewayModule),
        data: {title: 'Sip Gateway Management'},
      },
      {
        path: 'numberman',
        loadChildren: () => import('./numberman/numberman.module').then(m => m.NumberManModule),
        data: {title: 'Numbers Management', guiSection: 'NumbersManagement'},
      },
      {
        path: 'tracking-number',
        loadChildren: () => import('./tracking-number/tracking-number.module').then(m => m.TrackingNumberModule),
        data: {title: 'Tracking Number', guiSection: 'TrackingNumbers'},
      },
      {
        path: 'tracking-source',
        loadChildren: () => import('./tracking-source/tracking-source.module').then(m => m.TrackingSourceModule),
        data: {title: 'Tracking Source', guiSection: 'TrackingSources'},
      },
      {
        path: 'reports',
        loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule),
        data: {title: 'Reporting', guiSection: 'Reports'},
      },
      {
        path: 'customer',
        loadChildren: () => import('./customer/customer.module').then(m => m.CustomerModule),
        data: {title: 'Customer Management', guiSection: 'SystemSettings'},
      },
      {
        path: 'role',
        loadChildren: () => import('./role/role.module').then(m => m.RoleModule),
        data: {title: 'Role Management', guiSection: 'SystemSettings'},
      }
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {
}
