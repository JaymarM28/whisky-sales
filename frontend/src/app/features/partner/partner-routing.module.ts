import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PartnerShellComponent } from './partner-shell/partner-shell.component';
import { PartnerDashboardComponent } from './dashboard/partner-dashboard.component';
import { MySalesComponent } from './my-sales/my-sales.component';
import { MyCommissionsComponent } from './my-commissions/my-commissions.component';
import { PartnerSettingsComponent } from './settings/partner-settings.component';

const routes: Routes = [
  {
    path: '',
    component: PartnerShellComponent,
    children: [
      { path: 'dashboard', component: PartnerDashboardComponent },
      { path: 'my-sales', component: MySalesComponent },
      { path: 'my-commissions', component: MyCommissionsComponent },
      { path: 'settings', component: PartnerSettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PartnerRoutingModule {}
