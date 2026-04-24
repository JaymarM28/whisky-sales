import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommissionService } from '../../../core/services/commission.service';
import { UserService } from '../../../core/services/user.service';
import { SaleService } from '../../../core/services/sale.service';
import { CommissionPayment } from '../../../shared/models/commission.model';
import { User } from '../../../shared/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CommissionPayDialogComponent } from './commission-pay-dialog/commission-pay-dialog.component';

@Component({
  selector: 'app-owner-commissions',
  templateUrl: './commissions.component.html',
  styleUrls: ['./commissions.component.css'],
})
export class CommissionsComponent implements OnInit {
  pagos: CommissionPayment[] = [];
  socios: User[] = [];
  resumenSocios: any[] = [];
  cargando = true;
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  columnasPagos = ['fecha', 'socio', 'monto', 'referencia', 'acciones'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private commissionService: CommissionService,
    private userService: UserService,
    private saleService: SaleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    this.userService.getAll().subscribe((res) => {
      this.socios = res.data.filter((u) => u.active && u.role === 'PARTNER');
    });

    this.commissionService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.pagos = res.data;
        this.totalItems = res.total ?? 0;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarDatos();
  }

  abrirPago(): void {
    const dialogRef = this.dialog.open(CommissionPayDialogComponent, {
      width: '420px',
      data: { socios: this.socios },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) this.cargarDatos();
    });
  }

  confirmarEliminar(pago: CommissionPayment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo: 'Eliminar pago', mensaje: 'Esta acción no se puede deshacer.' },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.commissionService.remove(pago.id).subscribe({
          next: () => {
            this.snackBar.open('Pago eliminado', 'Cerrar', { duration: 3000 });
            this.cargarDatos();
          },
          error: () => {
            this.snackBar.open('Error al eliminar pago', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }
}
