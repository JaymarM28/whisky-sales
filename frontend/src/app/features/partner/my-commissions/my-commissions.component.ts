import { Component, OnInit } from '@angular/core';
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

  constructor(
    private commissionService: CommissionService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.cargando = true;
    this.commissionService.getAll().subscribe({
      next: (res) => {
        this.pagos = res.data;
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
