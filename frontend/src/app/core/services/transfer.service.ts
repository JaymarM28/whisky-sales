import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Transfer } from '../../shared/models/transfer.model';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly apiUrl = `${environment.apiUrl}/transfers`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20): Observable<ApiResponse<Transfer[]>> {
    return this.http.get<ApiResponse<Transfer[]>>(this.apiUrl, { params: { page, limit } });
  }

  getRecipients(): Observable<ApiResponse<{ id: string; name: string }[]>> {
    return this.http.get<ApiResponse<{ id: string; name: string }[]>>(`${this.apiUrl}/recipients`);
  }

  create(data: {
    fromPartnerId?: string;
    toPartnerId: string;
    productId: string;
    quantity: number;
    date: string;
    notes?: string;
  }): Observable<ApiResponse<Transfer>> {
    return this.http.post<ApiResponse<Transfer>>(this.apiUrl, data);
  }

  remove(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
