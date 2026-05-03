import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getRentabilidad(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rentabilidad`);
  }

  getVentas(desde?: string, hasta?: string): Observable<any> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get(`${this.apiUrl}/ventas`, { params });
  }

  getSocios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/socios`);
  }

  getInventario(): Observable<any> {
    return this.http.get(`${this.apiUrl}/inventario`);
  }

  getInventarioPorSocio(): Observable<any> {
    return this.http.get(`${this.apiUrl}/inventario-socios`);
  }
}
