import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReportsService } from '../../../core/services/reports.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  // Rentabilidad
  rentabilidad: any = null;
  cargandoRent = true;
  columnasRent = ['nombre', 'costPrice', 'salePrice', 'gananciaPorUnidad', 'totalVendido', 'gananciaTotal', 'margenPct'];

  // Ventas
  ventas: any = null;
  cargandoVentas = true;
  filtroForm!: FormGroup;
  columnasPorProducto = ['nombre', 'totalUnidades', 'totalIngresos', 'totalGanancia'];
  columnasPorSocio = ['nombre', 'totalUnidades', 'totalIngresos'];
  columnasPorMes = ['mes', 'totalUnidades', 'totalIngresos', 'totalGanancia'];

  // Socios
  socios: any[] = [];
  cargandoSocios = true;
  columnasSocios = ['nombre', 'totalEntregado', 'totalVendido', 'disponible', 'rendimientoPct', 'comisionGenerada', 'comisionPagada', 'comisionPendiente'];

  // Inventario
  inventario: any = null;
  cargandoInv = true;
  columnasInv = ['nombre', 'disponible', 'cajasDisponibles', 'rotacionPct', 'inversionDisponible', 'bajoStock'];

  constructor(
    private reportsService: ReportsService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const hoyStr = hoy.toISOString().slice(0, 10);

    this.filtroForm = this.fb.group({
      desde: [primerDiaMes],
      hasta: [hoyStr],
    });

    this.cargarRentabilidad();
    this.cargarVentas();
    this.cargarSocios();
    this.cargarInventario();
  }

  cargarRentabilidad(): void {
    this.cargandoRent = true;
    this.reportsService.getRentabilidad().subscribe({
      next: (res: any) => { this.rentabilidad = res.data; this.cargandoRent = false; },
      error: () => { this.cargandoRent = false; },
    });
  }

  cargarVentas(): void {
    this.cargandoVentas = true;
    const { desde, hasta } = this.filtroForm.value;
    this.reportsService.getVentas(desde, hasta).subscribe({
      next: (res: any) => { this.ventas = res.data; this.cargandoVentas = false; },
      error: () => { this.cargandoVentas = false; },
    });
  }

  cargarSocios(): void {
    this.cargandoSocios = true;
    this.reportsService.getSocios().subscribe({
      next: (res: any) => { this.socios = res.data; this.cargandoSocios = false; },
      error: () => { this.cargandoSocios = false; },
    });
  }

  cargarInventario(): void {
    this.cargandoInv = true;
    this.reportsService.getInventario().subscribe({
      next: (res: any) => { this.inventario = res.data; this.cargandoInv = false; },
      error: () => { this.cargandoInv = false; },
    });
  }

  aplicarFiltro(): void {
    this.cargarVentas();
  }
}
