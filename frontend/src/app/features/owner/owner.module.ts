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
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { OwnerRoutingModule } from './owner-routing.module';

import { OwnerShellComponent } from './owner-shell/owner-shell.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PartnersComponent } from './partners/partners.component';
import { PartnerFormDialogComponent } from './partners/partner-form-dialog/partner-form-dialog.component';
import { ProductsComponent } from './products/products.component';
import { ProductFormDialogComponent } from './products/product-form-dialog/product-form-dialog.component';
import { DeliveriesComponent } from './deliveries/deliveries.component';
import { DeliveryFormDialogComponent } from './deliveries/delivery-form-dialog/delivery-form-dialog.component';
import { SalesComponent } from './sales/sales.component';
import { ReceiptDialogComponent } from './sales/receipt-dialog/receipt-dialog.component';
import { CommissionsComponent } from './commissions/commissions.component';
import { CommissionPayDialogComponent } from './commissions/commission-pay-dialog/commission-pay-dialog.component';
import { SettingsComponent } from './settings/settings.component';
import { AdminComponent } from './admin/admin.component';
import { CreateTenantDialogComponent } from './admin/create-tenant-dialog/create-tenant-dialog.component';
import { CreateOwnerDialogComponent } from './admin/create-owner-dialog/create-owner-dialog.component';
import { ReportsComponent } from './reports/reports.component';

@NgModule({
  declarations: [
    OwnerShellComponent,
    DashboardComponent,
    PartnersComponent,
    PartnerFormDialogComponent,
    ProductsComponent,
    ProductFormDialogComponent,
    DeliveriesComponent,
    DeliveryFormDialogComponent,
    SalesComponent,
    ReceiptDialogComponent,
    CommissionsComponent,
    CommissionPayDialogComponent,
    SettingsComponent,
    AdminComponent,
    CreateTenantDialogComponent,
    CreateOwnerDialogComponent,
    ReportsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    OwnerRoutingModule,
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
    MatTabsModule,
    MatPaginatorModule,
  ],
})
export class OwnerModule {}
