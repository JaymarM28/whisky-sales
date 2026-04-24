import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Sale, SaleStatus } from '../../shared/models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20): Observable<ApiResponse<Sale[]>> {
    return this.http.get<ApiResponse<Sale[]>>(this.apiUrl, { params: { page, limit } });
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
