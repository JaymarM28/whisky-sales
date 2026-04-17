import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../../shared/models/user.model';
import { ApiResponse } from '../../shared/models/api-response.model';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private userSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get user$(): Observable<AuthUser | null> {
    return this.userSubject.asObservable();
  }

  login(cedula: string, pin: string): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, { cedula, pin })
      .pipe(
        tap((response) => {
          if (response.data) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            this.userSubject.next(response.data.user);
          }
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  private getUserFromStorage(): AuthUser | null {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }
}
