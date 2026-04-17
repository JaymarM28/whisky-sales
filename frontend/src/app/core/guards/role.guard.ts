import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'];
    const user = this.authService.currentUser;

    if (user && user.role === requiredRole) {
      return true;
    }

    // Redirigir al dashboard correcto según el rol
    if (user?.role === 'OWNER') {
      this.router.navigate(['/owner/dashboard']);
    } else if (user?.role === 'PARTNER') {
      this.router.navigate(['/partner/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }

    return false;
  }
}
