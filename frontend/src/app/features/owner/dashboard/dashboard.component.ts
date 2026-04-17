import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-owner-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  resumen: any = null;
  inventario: any[] = [];
  cargando = true;

  columnasInventario = ['socio', 'producto', 'entregado', 'vendido', 'disponible'];

  inventarioFlat: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    this.dashboardService.getOwnerDashboard().subscribe({
      next: (res) => {
        this.resumen = res.data;
      },
      error: () => {
        this.snackBar.open('Error al cargar el dashboard', 'Cerrar', { duration: 3000 });
      },
    });

    this.inventoryService.getAll().subscribe({
      next: (res) => {
        this.inventarioFlat = [];
        for (const partnerData of res.data) {
          for (const item of partnerData.inventory) {
            this.inventarioFlat.push({
              socio: partnerData.partner.name,
              producto: item.product.name,
              entregado: item.totalDelivered,
              vendido: item.totalSold,
              disponible: item.available,
            });
          }
        }
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }
}
