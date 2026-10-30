import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { ResumenPerdidas, StockLoss } from '../../shared/models/stock-loss.model';

@Injectable({ providedIn: 'root' })
export class StockLossService {
  private readonly apiUrl = `${environment.apiUrl}/losses`;

  constructor(private http: HttpClient) {}

  getAll(
    filtros: { partnerId?: string; productId?: string; desde?: string; hasta?: string } = {},
    page = 1,
    limit = 20,
  ): Observable<ApiResponse<StockLoss[]> & { resumen?: ResumenPerdidas }> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    for (const [k, v] of Object.entries(filtros)) if (v) params = params.set(k, v);
    return this.http.get<ApiResponse<StockLoss[]> & { resumen?: ResumenPerdidas }>(this.apiUrl, { params });
  }

  create(data: {
    productId: string;
    partnerId?: string;
    quantity: number;
    partnerSharePct?: number;
    date: string;
    notes?: string;
  }): Observable<ApiResponse<StockLoss>> {
    return this.http.post<ApiResponse<StockLoss>>(this.apiUrl, data);
  }

  remove(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
