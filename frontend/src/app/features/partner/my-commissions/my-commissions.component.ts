import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { CommissionService } from '../../../core/services/commission.service';
import { CommissionPayment } from '../../../shared/models/commission.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-commissions',
  templateUrl: './my-commissions.component.html',
  styleUrls: ['./my-commissions.component.css'],
})
export class MyCommissionsComponent implements OnInit {
  pagos: CommissionPayment[] = [];
  cargando = true;
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private commissionService: CommissionService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.cargando = true;
    this.commissionService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.pagos = res.data;
        this.totalItems = res.total ?? 0;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar comisiones', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  get totalRecibido(): number {
    return this.pagos.reduce((acc, p) => acc + p.amount, 0);
  }
}
