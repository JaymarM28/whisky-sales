import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CopCurrencyPipe } from './pipes/cop-currency.pipe';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SkeletonTableComponent } from './components/skeleton-table/skeleton-table.component';

@NgModule({
  declarations: [CopCurrencyPipe, ConfirmDialogComponent, SkeletonTableComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  exports: [CopCurrencyPipe, ConfirmDialogComponent, SkeletonTableComponent, CommonModule, MatIconModule],
})
export class SharedModule {}
