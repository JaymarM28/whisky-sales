import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProductFormDialogComponent } from './product-form-dialog/product-form-dialog.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit {
  productos: Product[] = [];
  cargando = true;
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  columnas = ['nombre', 'referencia', 'costo', 'precioSocio', 'precio', 'precioNegocio', 'margen', 'estado', 'acciones'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.productos = res.data;
        this.totalItems = res.total ?? 0;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar productos', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  margen(producto: Product): number {
    if (!producto.costPrice) return 0;
    return Math.round(((producto.salePrice - producto.costPrice) / producto.costPrice) * 100);
  }

  abrirFormulario(producto?: Product): void {
    const dialogRef = this.dialog.open(ProductFormDialogComponent, {
      width: '420px',
      data: { producto },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) this.cargarProductos();
    });
  }

  confirmarEliminar(producto: Product): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar producto',
        mensaje: `¿Estás seguro de que deseas eliminar "${producto.name}"?\n\n• Si el producto NO tiene entregas ni ventas registradas → se eliminará permanentemente.\n• Si tiene registros asociados → se desactivará y dejará de aparecer en inventario y ventas.`,
        confirmarLabel: 'Eliminar',
        confirmarColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.productService.deactivate(producto.id).subscribe({
          next: (res: any) => {
            const msg = res.data?.eliminado ? 'Producto eliminado' : 'Producto desactivado (tiene registros asociados)';
            this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
            this.cargarProductos();
          },
          error: () => {
            this.snackBar.open('Error al eliminar producto', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  confirmarActivar(producto: Product): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Activar producto',
        mensaje: `¿Activar "${producto.name}"?`,
        confirmarLabel: 'Activar',
        confirmarColor: 'primary',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.productService.activate(producto.id).subscribe({
          next: () => {
            this.snackBar.open('Producto activado', 'Cerrar', { duration: 3000 });
            this.cargarProductos();
          },
          error: () => {
            this.snackBar.open('Error al activar producto', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }
}
