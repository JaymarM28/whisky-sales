import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface RangoFechas {
  desde?: string;
  hasta?: string;
}

/** Filtro de rango de fechas (YYYY-MM-DD) con atajos de mes. Emite cada vez que cambia. */
@Component({
  selector: 'app-date-range-filter',
  templateUrl: './date-range-filter.component.html',
  styleUrls: ['./date-range-filter.component.css'],
})
export class DateRangeFilterComponent {
  @Input() desde = '';
  @Input() hasta = '';
  @Output() rangoChange = new EventEmitter<RangoFechas>();

  aplicar(): void {
    this.rangoChange.emit({ desde: this.desde || undefined, hasta: this.hasta || undefined });
  }

  esteMes(): void {
    const hoy = new Date();
    this.setRango(new Date(hoy.getFullYear(), hoy.getMonth(), 1), new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
  }

  mesPasado(): void {
    const hoy = new Date();
    this.setRango(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1), new Date(hoy.getFullYear(), hoy.getMonth(), 0));
  }

  limpiar(): void {
    this.desde = '';
    this.hasta = '';
    this.aplicar();
  }

  private setRango(inicio: Date, fin: Date): void {
    this.desde = this.formatear(inicio);
    this.hasta = this.formatear(fin);
    this.aplicar();
  }

  private formatear(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
