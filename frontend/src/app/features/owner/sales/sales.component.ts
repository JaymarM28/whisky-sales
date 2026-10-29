import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SaleService } from '../../../core/services/sale.service';
import { Sale } from '../../../shared/models/sale.model';
import { User } from '../../../shared/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { precioVentaUnitario } from '../../../shared/utils/sale-price';
import { RangoFechas } from '../../../shared/components/date-range-filter/date-range-filter.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReceiptDialogComponent } from './receipt-dialog/receipt-dialog.component';

@Component({
  selector: 'app-owner-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
})
export class SalesComponent implements OnInit {
  ventas: Sale[] = [];
  cargando = true;
  procesando = new Set<string>();
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  columnas = ['fecha', 'socio', 'producto', 'cantidad', 'cliente', 'valor', 'estado', 'comprobante', 'acciones'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  socios: User[] = [];
  filtroSocio = '';
  filtroEstado = '';
  estados = [
    { valor: 'PENDING', label: 'Pendientes' },
    { valor: 'CONFIRMED', label: 'Confirmadas' },
    { valor: 'REJECTED', label: 'Rechazadas' },
  ];
  rango: RangoFechas = {};

  constructor(
    private saleService: SaleService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.userService.getAll().subscribe((res) => (this.socios = res.data.filter((u) => u.role === 'PARTNER')));
    this.cargarVentas();
  }

  onRangoChange(rango: RangoFechas): void {
    this.rango = rango;
    this.filtrar();
  }

  filtrar(): void {
    this.currentPage = 1;
    this.cargarVentas();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.cargando = true;
    this.saleService.getAll(this.currentPage, this.pageSize, { partnerId: this.filtroSocio, status: this.filtroEstado, ...this.rango }).subscribe({
      next: (res) => {
        this.ventas = res.data;
        this.totalItems = res.total ?? 0;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar ventas', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  confirmarAnular(venta: Sale): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Anular venta confirmada',
        mensaje: `La venta pasará a "Rechazada": se descuenta de la comisión de ${venta.partner?.name} y las unidades vuelven a su inventario.`,
      },
    });
    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) this.cambiarEstado(venta, 'REJECTED');
    });
  }

  cambiarEstado(venta: Sale, status: 'CONFIRMED' | 'REJECTED'): void {
    this.procesando.add(venta.id);
    this.saleService.updateStatus(venta.id, status).subscribe({
      next: () => {
        this.procesando.delete(venta.id);
        this.snackBar.open(
          status === 'CONFIRMED' ? 'Venta confirmada' : 'Venta rechazada',
          'Cerrar',
          { duration: 3000 },
        );
        this.cargarVentas();
      },
      error: (err) => {
        this.procesando.delete(venta.id);
        this.snackBar.open(err.error?.error || 'Error al actualizar estado', 'Cerrar', { duration: 4000 });
      },
    });
  }

  verComprobante(venta: Sale): void {
    if (!venta.receiptImage) return;
    this.dialog.open(ReceiptDialogComponent, {
      data: { imageUrl: venta.receiptImage },
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
          error: (err) => {
            this.snackBar.open(err.error?.error || 'Error al eliminar venta', 'Cerrar', { duration: 5000 });
          },
        });
      }
    });
  }

  getPrecioUnitario(sale: Sale): number {
    return precioVentaUnitario(sale);
  }

  getLabelCliente(clientType: string): string {
    const labels: any = {
      CONSUMER: 'Consumidor',
      BUSINESS: 'Negocio 1',
      BUSINESS_2: 'Negocio 2',
      BUSINESS_3: 'Negocio 3',
    };
    return labels[clientType] || clientType;
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
