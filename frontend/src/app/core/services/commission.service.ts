import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { CommissionPayment } from '../../shared/models/commission.model';

@Injectable({ providedIn: 'root' })
export class CommissionService {
  private readonly apiUrl = `${environment.apiUrl}/commissions`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20): Observable<ApiResponse<CommissionPayment[]>> {
    return this.http.get<ApiResponse<CommissionPayment[]>>(this.apiUrl, { params: { page, limit } });
  }

  create(data: { partnerId: string; amount: number; paymentReference?: string; date: string }): Observable<ApiResponse<CommissionPayment>> {
    return this.http.post<ApiResponse<CommissionPayment>>(this.apiUrl, data);
  }

  getPending(partnerId: string): Observable<ApiResponse<{ pendiente: number; generada: number; pagada: number }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/pending/${partnerId}`);
  }

  remove(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
