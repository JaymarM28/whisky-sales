import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { Purchase, StockResumen } from '../../../shared/models/purchase.model';
import { Product } from '../../../shared/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PurchaseFormDialogComponent } from './purchase-form-dialog/purchase-form-dialog.component';
import { RangoFechas } from '../../../shared/components/date-range-filter/date-range-filter.component';

@Component({
  selector: 'app-purchases',
  templateUrl: './purchases.component.html',
  styleUrls: ['./purchases.component.css'],
})
export class PurchasesComponent implements OnInit {
  compras: Purchase[] = [];
  productos: Product[] = [];
  stock: StockResumen | null = null;
  cargando = true;
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  columnas = ['fecha', 'producto', 'cantidad', 'costoUnitario', 'total', 'proveedor', 'notas', 'acciones'];
  columnasStock = ['producto', 'comprado', 'entregado', 'devuelto', 'enBodega', 'invertido'];
  filtroProducto = '';
  rango: RangoFechas = {};
  resumen: { unidades: number; totalPagado: number } | null = null;

  constructor(
    private purchaseService: PurchaseService,
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.productService.getAll(1, 100).subscribe((res) => (this.productos = res.data.filter((p) => p.active)));
    this.cargarStock();
    this.cargarCompras();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarCompras();
  }

  cargarStock(): void {
    this.purchaseService.getStock().subscribe({
      next: (res) => (this.stock = res.data),
      error: () => this.snackBar.open('Error al cargar stock', 'Cerrar', { duration: 3000 }),
    });
  }

  cargarCompras(): void {
    this.cargando = true;
    this.purchaseService.getAll({ productId: this.filtroProducto, ...this.rango }, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.compras = res.data;
        this.totalItems = res.total ?? 0;
        this.resumen = res.resumen ?? null;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar compras', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  abrirFormulario(): void {
    const dialogRef = this.dialog.open(PurchaseFormDialogComponent, {
      width: '480px',
      data: { productos: this.productos },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.cargarCompras();
        this.cargarStock();
      }
    });
  }

  confirmarEliminar(compra: Purchase): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar compra',
        mensaje: 'Solo se puede eliminar si sus unidades siguen en bodega. El costo promedio del producto se recalculará.',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.purchaseService.remove(compra.id).subscribe({
          next: () => {
            this.snackBar.open('Compra eliminada', 'Cerrar', { duration: 3000 });
            this.cargarCompras();
            this.cargarStock();
          },
          error: (err) => {
            this.snackBar.open(err.error?.error || 'Error al eliminar compra', 'Cerrar', { duration: 4000 });
          },
        });
      }
    });
  }

  onRangoChange(rango: RangoFechas): void {
    this.rango = rango;
    this.filtrar();
  }

  filtrar(): void {
    this.currentPage = 1;
    this.cargarCompras();
  }

  get hayFiltros(): boolean {
    return !!(this.filtroProducto || this.rango.desde || this.rango.hasta);
  }
}
