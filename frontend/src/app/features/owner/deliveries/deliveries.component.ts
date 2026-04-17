import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryService } from '../../../core/services/delivery.service';
import { UserService } from '../../../core/services/user.service';
import { ProductService } from '../../../core/services/product.service';
import { Delivery } from '../../../shared/models/delivery.model';
import { User } from '../../../shared/models/user.model';
import { Product } from '../../../shared/models/product.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DeliveryFormDialogComponent } from './delivery-form-dialog/delivery-form-dialog.component';

@Component({
  selector: 'app-deliveries',
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.css'],
})
export class DeliveriesComponent implements OnInit {
  entregas: Delivery[] = [];
  socios: User[] = [];
  productos: Product[] = [];
  cargando = true;
  columnas = ['fecha', 'socio', 'producto', 'cantidad', 'notas', 'acciones'];

  filtroSocio = '';
  filtroProducto = '';

  constructor(
    private deliveryService: DeliveryService,
    private userService: UserService,
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.userService.getAll().subscribe((res) => (this.socios = res.data.filter((u) => u.active && u.role === 'PARTNER')));
    this.productService.getAll().subscribe((res) => (this.productos = res.data.filter((p) => p.active)));
    this.cargarEntregas();
  }

  cargarEntregas(): void {
    this.cargando = true;
    this.deliveryService
      .getAll(this.filtroSocio || undefined, this.filtroProducto || undefined)
      .subscribe({
        next: (res) => {
          this.entregas = res.data;
          this.cargando = false;
        },
        error: () => {
          this.snackBar.open('Error al cargar entregas', 'Cerrar', { duration: 3000 });
          this.cargando = false;
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
          error: () => {
            this.snackBar.open('Error al eliminar entrega', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroSocio = '';
    this.filtroProducto = '';
    this.cargarEntregas();
  }
}
