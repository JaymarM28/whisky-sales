import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CopCurrencyPipe } from './pipes/cop-currency.pipe';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SkeletonTableComponent } from './components/skeleton-table/skeleton-table.component';
import { EmailSettingsCardComponent } from './components/email-settings-card/email-settings-card.component';
import { DateRangeFilterComponent } from './components/date-range-filter/date-range-filter.component';

@NgModule({
  declarations: [CopCurrencyPipe, ConfirmDialogComponent, SkeletonTableComponent, EmailSettingsCardComponent, DateRangeFilterComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  exports: [CopCurrencyPipe, ConfirmDialogComponent, SkeletonTableComponent, EmailSettingsCardComponent, DateRangeFilterComponent, CommonModule, MatIconModule],
})
export class SharedModule {}
