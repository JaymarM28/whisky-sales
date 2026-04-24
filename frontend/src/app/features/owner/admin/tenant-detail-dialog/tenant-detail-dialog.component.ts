import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Tenant, TenantService } from '../../../../core/services/tenant.service';
import { User } from '../../../../shared/models/user.model';

export interface TenantDetailData {
  tenant: Tenant;
  owners: User[];
}

@Component({
  selector: 'app-tenant-detail-dialog',
  templateUrl: './tenant-detail-dialog.component.html',
  styleUrls: ['./tenant-detail-dialog.component.css'],
})
export class TenantDetailDialogComponent {
  tenant: Tenant;
  owners: User[];
  toggling = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: TenantDetailData,
    private dialogRef: MatDialogRef<TenantDetailDialogComponent>,
    private tenantService: TenantService,
    private snackBar: MatSnackBar,
  ) {
    this.tenant = { ...data.tenant };
    this.owners = data.owners.filter(o => o.tenantId === data.tenant.id);
  }

  toggle(): void {
    this.toggling = true;
    this.tenantService.toggle(this.tenant.id).subscribe({
      next: (res) => {
        this.tenant = res.data;
        this.toggling = false;
        this.snackBar.open(res.message ?? 'Estado actualizado', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.toggling = false;
        this.snackBar.open('Error al cambiar el estado', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
