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
}
