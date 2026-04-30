import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-partner-dashboard',
  templateUrl: './partner-dashboard.component.html',
  styleUrls: ['./partner-dashboard.component.css'],
})
export class PartnerDashboardComponent implements OnInit {
  resumen: any = null;
  cargando = true;
  columnasUltimas = ['fecha', 'producto', 'cantidad', 'cliente', 'estado'];

  constructor(
    private dashboardService: DashboardService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.dashboardService.getPartnerDashboard().subscribe({
      next: (res) => {
        this.resumen = res.data;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar el dashboard', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  getLabelEstado(status: string): string {
    const labels: any = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', REJECTED: 'Rechazada' };
    return labels[status] || status;
  }

  getChipClase(status: string): string {
    const clases: any = { PENDING: 'chip-pendiente', CONFIRMED: 'chip-confirmada', REJECTED: 'chip-rechazada' };
    return clases[status] || '';
  }
}
