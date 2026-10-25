import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PurchaseService } from '../../../../core/services/purchase.service';
import { Product } from '../../../../shared/models/product.model';

@Component({
  selector: 'app-purchase-form-dialog',
  templateUrl: './purchase-form-dialog.component.html',
  styleUrls: ['./purchase-form-dialog.component.css'],
})
export class PurchaseFormDialogComponent {
  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PurchaseFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { productos: Product[] },
  ) {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      modo: ['unidades'],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      totalCost: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      supplier: [''],
      notes: [''],
    });
  }

  get productoSeleccionado(): Product | undefined {
    return this.data.productos.find((p) => p.id === this.form.value.productId);
  }

  get permiteCajas(): boolean {
    return !!this.productoSeleccionado?.unitsPerBox;
  }

  /** Unidades reales que se enviarán al backend. */
  get unidades(): number {
    const cantidad = Number(this.form.value.cantidad) || 0;
    const porCaja = this.productoSeleccionado?.unitsPerBox;
    return this.form.value.modo === 'cajas' && porCaja ? cantidad * porCaja : cantidad;
  }

  get costoUnitario(): number {
    const total = Number(this.form.value.totalCost) || 0;
    return this.unidades > 0 ? Math.round(total / this.unidades) : 0;
  }

  onProductoChange(): void {
    if (!this.permiteCajas) this.form.patchValue({ modo: 'unidades' });
  }

  guardar(): void {
    if (this.form.invalid || this.unidades < 1) return;
    this.guardando = true;

    const { productId, totalCost, date, supplier, notes } = this.form.value;
    this.purchaseService
      .create({
        productId,
        quantity: this.unidades,
        totalCost: Number(totalCost),
        date,
        supplier: supplier || undefined,
        notes: notes || undefined,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Compra registrada', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Error al registrar compra', 'Cerrar', { duration: 3000 });
          this.guardando = false;
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
