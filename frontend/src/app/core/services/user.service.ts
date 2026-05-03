import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { User } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl);
  }

  create(data: { name: string; email?: string; cedula: string; pin: string; commissionPct?: number; role?: string; tenantId?: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, data);
  }

  getAllOwners(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/owners`);
  }

  updateMyPin(pin: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/me/pin`, { pin });
  }

  update(id: string, data: Partial<{ name: string; email: string; pin: string; commissionPct: number; canTransfer: boolean; active: boolean }>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, data);
  }

  deactivate(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  activate(id: string): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, { active: true });
  }

  remove(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}/permanent`);
  }
}
