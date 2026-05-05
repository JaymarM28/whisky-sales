import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SaleService } from '../../../core/services/sale.service';
import { Sale } from '../../../shared/models/sale.model';
import { ReportSaleDialogComponent } from './report-sale-dialog/report-sale-dialog.component';

@Component({
  selector: 'app-my-sales',
  templateUrl: './my-sales.component.html',
  styleUrls: ['./my-sales.component.css'],
})
export class MySalesComponent implements OnInit {
  ventas: Sale[] = [];
  cargando = true;
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  columnas = ['fecha', 'producto', 'cantidad', 'cliente', 'estado', 'notas'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private saleService: SaleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarVentas();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.cargando = true;
    this.saleService.getAll(this.currentPage, this.pageSize).subscribe({
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

  reportarVenta(): void {
    const dialogRef = this.dialog.open(ReportSaleDialogComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) this.cargarVentas();
    });
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
