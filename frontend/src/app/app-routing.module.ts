import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'owner',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'OWNER' },
    loadChildren: () =>
      import('./features/owner/owner.module').then((m) => m.OwnerModule),
  },
  {
    path: 'partner',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'PARTNER' },
    loadChildren: () =>
      import('./features/partner/partner.module').then((m) => m.PartnerModule),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
