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
  columnasPorTipo = ['label', 'totalVentas', 'totalUnidades', 'totalIngresos', 'totalGanancia'];

  // Socios
  socios: any[] = [];
  cargandoSocios = true;
  columnasSocios = ['nombre', 'totalEntregado', 'totalVendido', 'disponible', 'rendimientoPct', 'comisionGenerada', 'comisionPagada', 'comisionPendiente'];

  // Inventario
  inventario: any = null;
  cargandoInv = true;
  columnasInv = ['nombre', 'disponible', 'cajasDisponibles', 'rotacionPct', 'inversionDisponible', 'bajoStock'];

  // Inventario por socio
  inventarioSocios: any[] = [];
  cargandoInvSocios = true;
  columnasProductoSocio = ['producto', 'entregas', 'ventasConf', 'ventasPend', 'trOut', 'trIn', 'disponible'];
  columnasMov = ['fecha', 'tipo', 'cantidad', 'contraparte', 'notas'];

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
    this.cargarInventarioSocios();
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

  cargarInventarioSocios(): void {
    this.cargandoInvSocios = true;
    this.reportsService.getInventarioPorSocio().subscribe({
      next: (res: any) => { this.inventarioSocios = res.data; this.cargandoInvSocios = false; },
      error: () => { this.cargandoInvSocios = false; },
    });
  }

  tipoMovLabel(tipo: string): string {
    const map: Record<string, string> = {
      ENTREGA: 'Entrega',
      VENTA_CONF: 'Venta confirmada',
      VENTA_PEND: 'Venta pendiente',
      TRASPASO_SALIDA: 'Traspaso salida',
      TRASPASO_ENTRADA: 'Traspaso entrada',
    };
    return map[tipo] ?? tipo;
  }

  tipoMovClase(tipo: string): string {
    const map: Record<string, string> = {
      ENTREGA: 'chip-entrega',
      VENTA_CONF: 'chip-confirmada',
      VENTA_PEND: 'chip-pendiente',
      TRASPASO_SALIDA: 'chip-traspaso-out',
      TRASPASO_ENTRADA: 'chip-traspaso-in',
    };
    return map[tipo] ?? '';
  }

  signoMov(tipo: string): string {
    return ['ENTREGA', 'TRASPASO_ENTRADA'].includes(tipo) ? '+' : '−';
  }
}
