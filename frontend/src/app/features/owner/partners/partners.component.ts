import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PartnerFormDialogComponent } from './partner-form-dialog/partner-form-dialog.component';

@Component({
  selector: 'app-partners',
  templateUrl: './partners.component.html',
  styleUrls: ['./partners.component.css'],
})
export class PartnersComponent implements OnInit {
  socios: User[] = [];
  cargando = true;
  columnas = ['nombre', 'comision', 'traspaso', 'estado', 'acciones'];

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarSocios();
  }

  cargarSocios(): void {
    this.cargando = true;
    this.userService.getAll().subscribe({
      next: (res) => {
        this.socios = res.data;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar socios', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  abrirFormulario(socio?: User): void {
    const dialogRef = this.dialog.open(PartnerFormDialogComponent, {
      width: '420px',
      data: { socio },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) this.cargarSocios();
    });
  }

  toggleCanTransfer(socio: User): void {
    this.userService.update(socio.id, { canTransfer: !socio.canTransfer }).subscribe({
      next: () => {
        const msg = !socio.canTransfer ? 'Traspaso habilitado' : 'Traspaso deshabilitado';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
        this.cargarSocios();
      },
      error: () => {
        this.snackBar.open('Error al actualizar permiso', 'Cerrar', { duration: 3000 });
      },
    });
  }

  confirmarActivar(socio: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Activar socio',
        mensaje: `¿Activar a ${socio.name}? Podrá volver a iniciar sesión.`,
        confirmarLabel: 'Activar',
        confirmarColor: 'primary',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.userService.activate(socio.id).subscribe({
          next: () => {
            this.snackBar.open('Socio activado', 'Cerrar', { duration: 3000 });
            this.cargarSocios();
          },
          error: () => {
            this.snackBar.open('Error al activar socio', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  confirmarDesactivar(socio: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Desactivar socio',
        mensaje: `¿Desactivar a ${socio.name}? No podrá iniciar sesión.`,
        confirmarLabel: 'Desactivar',
        confirmarColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.userService.deactivate(socio.id).subscribe({
          next: () => {
            this.snackBar.open('Socio desactivado', 'Cerrar', { duration: 3000 });
            this.cargarSocios();
          },
          error: () => {
            this.snackBar.open('Error al desactivar socio', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }
}
