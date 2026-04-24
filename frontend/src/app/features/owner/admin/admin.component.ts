import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TenantService, Tenant } from '../../../core/services/tenant.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';
import { CreateTenantDialogComponent } from './create-tenant-dialog/create-tenant-dialog.component';
import { CreateOwnerDialogComponent } from './create-owner-dialog/create-owner-dialog.component';
import { TenantDetailDialogComponent } from './tenant-detail-dialog/tenant-detail-dialog.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  tenants: Tenant[] = [];
  owners: User[] = [];
  cargandoTenants = true;
  cargandoOwners = true;

  columnasTenants = ['nombre', 'slug', 'estado', 'acciones'];
  columnasOwners = ['nombre', 'cedula', 'negocio', 'estado', 'acciones'];

  constructor(
    private tenantService: TenantService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarTenants();
    this.cargarOwners();
  }

  cargarTenants(): void {
    this.cargandoTenants = true;
    this.tenantService.getAll().subscribe({
      next: (res: any) => { this.tenants = res.data; this.cargandoTenants = false; },
      error: () => { this.cargandoTenants = false; },
    });
  }

  cargarOwners(): void {
    this.cargandoOwners = true;
    this.userService.getAllOwners().subscribe({
      next: (res: any) => { this.owners = res.data; this.cargandoOwners = false; },
      error: () => { this.cargandoOwners = false; },
    });
  }

  abrirCrearNegocio(): void {
    const ref = this.dialog.open(CreateTenantDialogComponent, { width: '420px', disableClose: true });
    ref.afterClosed().subscribe((creado) => { if (creado) this.cargarTenants(); });
  }

  abrirCrearOwner(): void {
    const ref = this.dialog.open(CreateOwnerDialogComponent, {
      width: '420px',
      disableClose: true,
      data: { tenants: this.tenants },
    });
    ref.afterClosed().subscribe((creado) => { if (creado) this.cargarOwners(); });
  }

  toggleTenant(tenant: Tenant): void {
    const ref = this.dialog.open(TenantDetailDialogComponent, {
      width: '460px',
      data: { tenant, owners: this.owners },
    });
    ref.afterClosed().subscribe((cambiado) => { if (cambiado) this.cargarTenants(); });
  }
}
