import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Purchase, StockResumen } from '../../shared/models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly apiUrl = `${environment.apiUrl}/purchases`;

  constructor(private http: HttpClient) {}

  getAll(
    filtros: { productId?: string; desde?: string; hasta?: string } = {},
    page = 1,
    limit = 20,
  ): Observable<ApiResponse<Purchase[]> & { resumen?: { unidades: number; totalPagado: number } }> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    for (const [k, v] of Object.entries(filtros)) if (v) params = params.set(k, v);
    return this.http.get<ApiResponse<Purchase[]> & { resumen?: { unidades: number; totalPagado: number } }>(this.apiUrl, { params });
  }

  getStock(): Observable<ApiResponse<StockResumen>> {
    return this.http.get<ApiResponse<StockResumen>>(`${this.apiUrl}/stock`);
  }

  create(data: {
    productId: string;
    quantity: number;
    totalCost: number;
    date: string;
    supplier?: string;
    notes?: string;
  }): Observable<ApiResponse<Purchase>> {
    return this.http.post<ApiResponse<Purchase>>(this.apiUrl, data);
  }

  remove(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
