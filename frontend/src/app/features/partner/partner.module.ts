import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PartnerRoutingModule } from './partner-routing.module';

import { PartnerShellComponent } from './partner-shell/partner-shell.component';
import { PartnerDashboardComponent } from './dashboard/partner-dashboard.component';
import { MySalesComponent } from './my-sales/my-sales.component';
import { ReportSaleDialogComponent } from './my-sales/report-sale-dialog/report-sale-dialog.component';
import { MyCommissionsComponent } from './my-commissions/my-commissions.component';
import { PartnerSettingsComponent } from './settings/partner-settings.component';

@NgModule({
  declarations: [
    PartnerShellComponent,
    PartnerDashboardComponent,
    MySalesComponent,
    ReportSaleDialogComponent,
    MyCommissionsComponent,
    PartnerSettingsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    PartnerRoutingModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
})
export class PartnerModule {}
