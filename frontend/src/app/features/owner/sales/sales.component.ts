import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SaleService } from '../../../core/services/sale.service';
import { Sale } from '../../../shared/models/sale.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReceiptDialogComponent } from './receipt-dialog/receipt-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-owner-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
})
export class SalesComponent implements OnInit {
  ventas: Sale[] = [];
  cargando = true;
  columnas = ['fecha', 'socio', 'producto', 'cantidad', 'estado', 'comprobante', 'acciones'];

  constructor(
    private saleService: SaleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.cargando = true;
    this.saleService.getAll().subscribe({
      next: (res) => {
        this.ventas = res.data;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar ventas', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  cambiarEstado(venta: Sale, status: 'CONFIRMED' | 'REJECTED'): void {
    this.saleService.updateStatus(venta.id, status).subscribe({
      next: () => {
        this.snackBar.open(
          status === 'CONFIRMED' ? 'Venta confirmada' : 'Venta rechazada',
          'Cerrar',
          { duration: 3000 },
        );
        this.cargarVentas();
      },
      error: () => {
        this.snackBar.open('Error al actualizar estado', 'Cerrar', { duration: 3000 });
      },
    });
  }

  verComprobante(venta: Sale): void {
    if (!venta.receiptImage) return;
    this.dialog.open(ReceiptDialogComponent, {
      data: { imageUrl: `${environment.apiUrl.replace('/api', '')}${venta.receiptImage}` },
      maxWidth: '90vw',
    });
  }

  confirmarEliminar(venta: Sale): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo: 'Eliminar venta', mensaje: 'Esta acción no se puede deshacer.' },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.saleService.remove(venta.id).subscribe({
          next: () => {
            this.snackBar.open('Venta eliminada', 'Cerrar', { duration: 3000 });
            this.cargarVentas();
          },
          error: () => {
            this.snackBar.open('Error al eliminar venta', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  getLabelEstado(status: string): string {
    const labels: any = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', REJECTED: 'Rechazada' };
    return labels[status] || status;
  }

  getChipClass(status: string): string {
    const clases: any = { PENDING: 'chip-pendiente', CONFIRMED: 'chip-confirmada', REJECTED: 'chip-rechazada' };
    return clases[status] || '';
  }
}
