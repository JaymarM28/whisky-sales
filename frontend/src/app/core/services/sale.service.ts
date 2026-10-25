import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Sale, SaleStatus } from '../../shared/models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20, filtros: { partnerId?: string; desde?: string; hasta?: string } = {}): Observable<ApiResponse<Sale[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    for (const [k, v] of Object.entries(filtros)) if (v) params = params.set(k, v);
    return this.http.get<ApiResponse<Sale[]>>(this.apiUrl, { params });
  }

  create(formData: FormData): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(this.apiUrl, formData);
  }

  updateStatus(id: string, status: SaleStatus): Observable<ApiResponse<Sale>> {
    return this.http.patch<ApiResponse<Sale>>(`${this.apiUrl}/${id}/status`, { status });
  }

  remove(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
