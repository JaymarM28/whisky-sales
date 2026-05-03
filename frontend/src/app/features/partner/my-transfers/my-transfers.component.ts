import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransferService } from '../../../core/services/transfer.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth.service';
import { Transfer } from '../../../shared/models/transfer.model';
import { TransferDialogComponent } from './transfer-dialog/transfer-dialog.component';

@Component({
  selector: 'app-my-transfers',
  templateUrl: './my-transfers.component.html',
})
export class MyTransfersComponent implements OnInit {
  traspasos: Transfer[] = [];
  cargando = true;
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  columnas = ['fecha', 'de', 'a', 'producto', 'cantidad', 'notas'];

  socios: { id: string; name: string }[] = [];
  inventario: any[] = [];

  constructor(
    private transferService: TransferService,
    private inventoryService: InventoryService,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.cargarTraspasos();
    this.cargarDatosFormulario();
  }

  private cargarDatosFormulario(): void {
    const userId = this.authService.currentUser!.id;
    this.transferService.getRecipients().subscribe({
      next: (res) => { this.socios = res.data; },
      error: () => { this.snackBar.open('Error al cargar socios', 'Cerrar', { duration: 3000 }); },
    });
    this.inventoryService.getByPartner(userId).subscribe({
      next: (res) => { this.inventario = res.data.filter((i: any) => i.available > 0); },
      error: () => {},
    });
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
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '460px',
      data: { socios: this.socios, inventario: this.inventario },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.cargarTraspasos();
        this.cargarDatosFormulario();
      }
    });
  }
}
