import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { AuthModule } from './modules/auth/auth.module';
import { AccountActivateComponent } from "@app/modules/auth/account-activate/account-activate.component";
import { ClientComponent } from '@app/modules/client/client.component';
import { AuthLazyGuard } from '@app/guards/auth/auth-lazy.guard';

const routes: Routes = [
  { path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  { path: 'auth/account-activate', component: AccountActivateComponent, pathMatch: 'full'},
  {
    path: 'service',
    component: ClientComponent,
    canLoad: [AuthLazyGuard],
    loadChildren: () => import('./modules/client/client.module').then(m => m.ClientModule),
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, onSameUrlNavigation: 'reload' }), AuthModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
