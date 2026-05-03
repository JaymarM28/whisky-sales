import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransferService } from '../../../core/services/transfer.service';
import { Transfer } from '../../../shared/models/transfer.model';
import { TransferFormDialogComponent } from './transfer-form-dialog/transfer-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-transfers',
  templateUrl: './transfers.component.html',
})
export class TransfersComponent implements OnInit {
  traspasos: Transfer[] = [];
  cargando = true;
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  columnas = ['fecha', 'de', 'a', 'producto', 'cantidad', 'notas', 'acciones'];

  constructor(
    private transferService: TransferService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarTraspasos();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarTraspasos();
  }

  cargarTraspasos(): void {
    this.cargando = true;
    this.transferService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.traspasos = res.data;
        this.totalItems = res.total ?? 0;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar traspasos', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      },
    });
  }

  abrirFormulario(): void {
    const dialogRef = this.dialog.open(TransferFormDialogComponent, {
      width: '500px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) this.cargarTraspasos();
    });
  }

  confirmarEliminar(traspaso: Transfer): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar traspaso',
        mensaje: `¿Eliminar el traspaso de ${traspaso.fromPartner.name} a ${traspaso.toPartner.name}?`,
        confirmarLabel: 'Eliminar',
        confirmarColor: 'warn',
      },
    });
    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.transferService.remove(traspaso.id).subscribe({
          next: () => {
            this.snackBar.open('Traspaso eliminado', 'Cerrar', { duration: 3000 });
            this.cargarTraspasos();
          },
          error: () => {
            this.snackBar.open('Error al eliminar traspaso', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }
}
