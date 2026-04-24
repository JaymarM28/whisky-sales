import { Component, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-owner-shell',
  templateUrl: './owner-shell.component.html',
  styleUrls: ['./owner-shell.component.css'],
})
export class OwnerShellComponent implements AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  navItems = [
    { label: 'Dashboard',  icon: 'dashboard',     route: '/owner/dashboard' },
    { label: 'Socios',     icon: 'people',         route: '/owner/partners' },
    { label: 'Productos',  icon: 'inventory_2',    route: '/owner/products' },
    { label: 'Entregas',   icon: 'local_shipping', route: '/owner/deliveries' },
    { label: 'Ventas',     icon: 'point_of_sale',  route: '/owner/sales' },
    { label: 'Comisiones', icon: 'payments',       route: '/owner/commissions' },
    { label: 'Informes',   icon: 'bar_chart',      route: '/owner/reports' },
  ];

  adminNavItems = [
    { label: 'Plataforma', icon: 'admin_panel_settings', route: '/owner/admin' },
  ];

  get esAdmin(): boolean {
    return !!this.authService.currentUser?.isAdmin;
  }

  paginaActual = 'Dashboard';
  isMobile = window.innerWidth < 768;

  private titulos: Record<string, string> = {
    '/owner/dashboard':   'Dashboard',
    '/owner/partners':    'Socios',
    '/owner/products':    'Productos',
    '/owner/deliveries':  'Entregas',
    '/owner/sales':       'Ventas',
    '/owner/commissions': 'Comisiones',
    '/owner/reports':     'Informes',
    '/owner/settings':    'Configuración',
    '/owner/admin':       'Administración',
  };

  constructor(public authService: AuthService, private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.paginaActual = this.titulos[e.urlAfterRedirects] || 'J&L Liquors';
      });
  }

  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile) this.sidenav.close();
      });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.sidenav.close();
    } else {
      this.sidenav.open();
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
