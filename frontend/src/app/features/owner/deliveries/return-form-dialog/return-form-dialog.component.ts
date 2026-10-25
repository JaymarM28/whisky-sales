import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StockReturnService } from '../../../../core/services/stock-return.service';
import { InventoryService } from '../../../../core/services/inventory.service';
import { User } from '../../../../shared/models/user.model';

interface ItemInventario {
  product: { id: string; name: string };
  available: number;
}

@Component({
  selector: 'app-return-form-dialog',
  templateUrl: './return-form-dialog.component.html',
  styleUrls: ['./return-form-dialog.component.css'],
})
export class ReturnFormDialogComponent {
  form: FormGroup;
  guardando = false;
  cargandoInventario = false;
  /** Productos que el socio seleccionado tiene en su poder. */
  inventario: ItemInventario[] = [];

  constructor(
    private fb: FormBuilder,
    private returnService: StockReturnService,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ReturnFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socios: User[] },
  ) {
    this.form = this.fb.group({
      partnerId: ['', Validators.required],
      productId: [{ value: '', disabled: true }, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: [''],
    });
  }

  get disponible(): number | null {
    const item = this.inventario.find((i) => i.product.id === this.form.get('productId')!.value);
    return item ? item.available : null;
  }

  get excede(): boolean {
    return this.disponible !== null && this.form.value.quantity > this.disponible;
  }

  onSocioChange(): void {
    const producto = this.form.get('productId')!;
    producto.reset({ value: '', disabled: true });
    this.inventario = [];
    this.cargandoInventario = true;

    this.inventoryService.getByPartner(this.form.value.partnerId).subscribe({
      next: (res) => {
        this.inventario = (res.data as ItemInventario[]).filter((i) => i.available > 0);
        if (this.inventario.length > 0) producto.enable();
        this.cargandoInventario = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar el inventario del socio', 'Cerrar', { duration: 3000 });
        this.cargandoInventario = false;
      },
    });
  }

  guardar(): void {
    if (this.form.invalid || this.excede) return;
    this.guardando = true;

    this.returnService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Devolución registrada', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al registrar devolución', 'Cerrar', { duration: 4000 });
        this.guardando = false;
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
