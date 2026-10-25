import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { StockReturn } from '../../shared/models/stock-return.model';

@Injectable({ providedIn: 'root' })
export class StockReturnService {
  private readonly apiUrl = `${environment.apiUrl}/returns`;

  constructor(private http: HttpClient) {}

  getAll(
    filtros: { partnerId?: string; productId?: string; desde?: string; hasta?: string } = {},
    page = 1,
    limit = 20,
  ): Observable<ApiResponse<StockReturn[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    for (const [k, v] of Object.entries(filtros)) if (v) params = params.set(k, v);
    return this.http.get<ApiResponse<StockReturn[]>>(this.apiUrl, { params });
  }

  create(data: { partnerId: string; productId: string; quantity: number; date: string; notes?: string }): Observable<ApiResponse<StockReturn>> {
    return this.http.post<ApiResponse<StockReturn>>(this.apiUrl, data);
  }

  remove(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
