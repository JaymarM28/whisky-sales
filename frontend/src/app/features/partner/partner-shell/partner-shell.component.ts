import { Component, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-partner-shell',
  templateUrl: './partner-shell.component.html',
  styleUrls: ['./partner-shell.component.css'],
})
export class PartnerShellComponent {
  navItems = [
    { label: 'Dashboard',      icon: 'dashboard',     route: '/partner/dashboard' },
    { label: 'Mis ventas',     icon: 'point_of_sale',  route: '/partner/my-sales' },
    { label: 'Mis comisiones', icon: 'receipt_long',   route: '/partner/my-commissions' },
  ];

  paginaActual = 'Dashboard';
  isMobile = window.innerWidth < 768;
  sidenavAbierto = !this.isMobile;

  private titulos: Record<string, string> = {
    '/partner/dashboard':      'Dashboard',
    '/partner/my-sales':       'Mis ventas',
    '/partner/my-commissions': 'Mis comisiones',
  };

  constructor(public authService: AuthService, private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.paginaActual = this.titulos[e.urlAfterRedirects] || 'J&L Liquors';
        if (this.isMobile) this.sidenavAbierto = false;
      });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
    this.sidenavAbierto = !this.isMobile;
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
