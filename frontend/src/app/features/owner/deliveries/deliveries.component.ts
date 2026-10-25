import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryService } from '../../../core/services/delivery.service';
import { StockReturnService } from '../../../core/services/stock-return.service';
import { UserService } from '../../../core/services/user.service';
import { ProductService } from '../../../core/services/product.service';
import { Delivery } from '../../../shared/models/delivery.model';
import { StockReturn } from '../../../shared/models/stock-return.model';
import { User } from '../../../shared/models/user.model';
import { Product } from '../../../shared/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { RangoFechas } from '../../../shared/components/date-range-filter/date-range-filter.component';
import { DeliveryFormDialogComponent } from './delivery-form-dialog/delivery-form-dialog.component';
import { ReturnFormDialogComponent } from './return-form-dialog/return-form-dialog.component';

@Component({
  selector: 'app-deliveries',
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.css'],
})
export class DeliveriesComponent implements OnInit {
  socios: User[] = [];
  productos: Product[] = [];
  columnas = ['fecha', 'socio', 'producto', 'cantidad', 'notas', 'acciones'];
  filtroSocio = '';
  filtroProducto = '';
  rango: RangoFechas = {};
  pageSize = 20;

  entregas: Delivery[] = [];
  cargando = true;
  totalItems = 0;
  currentPage = 1;

  devoluciones: StockReturn[] = [];
  cargandoDev = true;
  totalDev = 0;
  paginaDev = 1;

  constructor(
    private deliveryService: DeliveryService,
    private returnService: StockReturnService,
    private userService: UserService,
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.userService.getAll().subscribe((res) => (this.socios = res.data.filter((u) => u.active && u.role === 'PARTNER')));
    this.productService.getAll(1, 100).subscribe((res) => (this.productos = res.data.filter((p) => p.active)));
    this.cargarEntregas();
    this.cargarDevoluciones();
  }

  private get filtros() {
    return { partnerId: this.filtroSocio, productId: this.filtroProducto, ...this.rango };
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarEntregas();
  }

  onPageDevChange(event: PageEvent): void {
    this.paginaDev = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarDevoluciones();
  }

  onRangoChange(rango: RangoFechas): void {
    this.rango = rango;
    this.filtrar();
  }

  filtrar(): void {
    this.currentPage = 1;
    this.paginaDev = 1;
    this.cargarEntregas();
    this.cargarDevoluciones();
  }

  cargarEntregas(): void {
    this.cargando = true;
    this.deliveryService.getAll(this.filtros, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.entregas = res.data;
        this.totalItems = res.total ?? 0;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar entregas', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  cargarDevoluciones(): void {
    this.cargandoDev = true;
    this.returnService.getAll(this.filtros, this.paginaDev, this.pageSize).subscribe({
      next: (res) => {
        this.devoluciones = res.data;
        this.totalDev = res.total ?? 0;
        this.cargandoDev = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar devoluciones', 'Cerrar', { duration: 3000 });
        this.cargandoDev = false;
      },
    });
  }

  abrirFormulario(): void {
    const dialogRef = this.dialog.open(DeliveryFormDialogComponent, {
      width: '480px',
      data: { socios: this.socios, productos: this.productos },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) this.cargarEntregas();
    });
  }

  abrirDevolucion(): void {
    const dialogRef = this.dialog.open(ReturnFormDialogComponent, {
      width: '480px',
      data: { socios: this.socios },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) this.cargarDevoluciones();
    });
  }

  confirmarEliminar(entrega: Delivery): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo: 'Eliminar entrega', mensaje: 'Esta acción no se puede deshacer.' },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.deliveryService.remove(entrega.id).subscribe({
          next: () => {
            this.snackBar.open('Entrega eliminada', 'Cerrar', { duration: 3000 });
            this.cargarEntregas();
          },
          error: (err) => {
            this.snackBar.open(err.error?.error || 'Error al eliminar entrega', 'Cerrar', { duration: 5000 });
          },
        });
      }
    });
  }

  confirmarEliminarDevolucion(devolucion: StockReturn): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar devolución',
        mensaje: `Las ${devolucion.quantity} unidades volverán al inventario de ${devolucion.partner.name}.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.returnService.remove(devolucion.id).subscribe({
          next: () => {
            this.snackBar.open('Devolución eliminada', 'Cerrar', { duration: 3000 });
            this.cargarDevoluciones();
          },
          error: (err) => {
            this.snackBar.open(err.error?.error || 'Error al eliminar devolución', 'Cerrar', { duration: 5000 });
          },
        });
      }
    });
  }
}
