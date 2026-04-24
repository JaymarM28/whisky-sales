import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Tenant[]>> {
    return this.http.get<ApiResponse<Tenant[]>>(this.apiUrl);
  }

  create(data: { name: string; slug: string }): Observable<ApiResponse<Tenant>> {
    return this.http.post<ApiResponse<Tenant>>(this.apiUrl, data);
  }

  toggle(id: string): Observable<ApiResponse<Tenant>> {
    return this.http.patch<ApiResponse<Tenant>>(`${this.apiUrl}/${id}/toggle`, {});
  }
}
