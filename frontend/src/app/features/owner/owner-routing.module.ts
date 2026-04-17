import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OwnerShellComponent } from './owner-shell/owner-shell.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PartnersComponent } from './partners/partners.component';
import { ProductsComponent } from './products/products.component';
import { DeliveriesComponent } from './deliveries/deliveries.component';
import { SalesComponent } from './sales/sales.component';
import { CommissionsComponent } from './commissions/commissions.component';
import { SettingsComponent } from './settings/settings.component';
import { AdminComponent } from './admin/admin.component';
import { ReportsComponent } from './reports/reports.component';

const routes: Routes = [
  {
    path: '',
    component: OwnerShellComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'partners', component: PartnersComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'deliveries', component: DeliveriesComponent },
      { path: 'sales', component: SalesComponent },
      { path: 'commissions', component: CommissionsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'admin', component: AdminComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OwnerRoutingModule {}
