import { Component, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-partner-shell',
  templateUrl: './partner-shell.component.html',
  styleUrls: ['./partner-shell.component.css'],
})
export class PartnerShellComponent implements AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  navItems = [
    { label: 'Dashboard',      icon: 'dashboard',      route: '/partner/dashboard' },
    { label: 'Mis ventas',     icon: 'point_of_sale',  route: '/partner/my-sales' },
    { label: 'Mis comisiones', icon: 'receipt_long',   route: '/partner/my-commissions' },
    { label: 'Configuración',  icon: 'settings',       route: '/partner/settings' },
  ];

  paginaActual = 'Dashboard';
  isMobile = window.innerWidth < 768;

  private titulos: Record<string, string> = {
    '/partner/dashboard':      'Dashboard',
    '/partner/my-sales':       'Mis ventas',
    '/partner/my-commissions': 'Mis comisiones',
    '/partner/settings':       'Configuración',
  };

  constructor(public authService: AuthService, private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.paginaActual = this.titulos[e.urlAfterRedirects] || 'JM Liquors';
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
