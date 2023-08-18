import {RouterModule, Routes} from '@angular/router';
import {CallLogsComponent} from '@app/modules/client/call-logs/call-logs/call-logs.component';
import {NgModule} from '@angular/core';
import { RoleGuard } from '@app/guards/auth/role.guard';


const routes: Routes = [
  {
    path: '',
    component: CallLogsComponent,
    pathMatch: 'full',
    canActivate: [RoleGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class CallLogsRoutingModule {}
