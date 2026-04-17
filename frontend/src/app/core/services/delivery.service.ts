import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Delivery } from '../../shared/models/delivery.model';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly apiUrl = `${environment.apiUrl}/deliveries`;

  constructor(private http: HttpClient) {}

  getAll(partnerId?: string, productId?: string): Observable<ApiResponse<Delivery[]>> {
    let params = new HttpParams();
    if (partnerId) params = params.set('partnerId', partnerId);
    if (productId) params = params.set('productId', productId);
    return this.http.get<ApiResponse<Delivery[]>>(this.apiUrl, { params });
  }

  create(data: { partnerId: string; productId: string; quantity: number; date: string; notes?: string }): Observable<ApiResponse<Delivery>> {
    return this.http.post<ApiResponse<Delivery>>(this.apiUrl, data);
  }

  remove(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
