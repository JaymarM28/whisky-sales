import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../shared/models/product.model';

@Component({
  selector: 'app-product-form-dialog',
  templateUrl: './product-form-dialog.component.html',
  styleUrls: ['./product-form-dialog.component.css'],
})
export class ProductFormDialogComponent implements OnInit {
  form!: FormGroup;
  esEdicion = false;
  guardando = false;
  costoPorBotella: number | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProductFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto?: Product },
  ) {}

  ngOnInit(): void {
    this.esEdicion = !!this.data.producto;
    this.form = this.fb.group({
      name: [this.data.producto?.name || '', Validators.required],
      reference: [this.data.producto?.reference || '', Validators.required],
      unitsPerBox: [this.data.producto?.unitsPerBox || null],
      boxCost: [this.data.producto?.boxCost || null],
      costPrice: [this.data.producto?.costPrice || '', [Validators.required, Validators.min(1)]],
      partnerPrice: [this.data.producto?.partnerPrice || '', [Validators.required, Validators.min(1)]],
      salePrice: [this.data.producto?.salePrice || '', [Validators.required, Validators.min(1)]],
      businessPrice: [this.data.producto?.businessPrice || 0, [Validators.min(0)]],
    });

    this.recalcularCosto();

    this.form.get('boxCost')!.valueChanges.subscribe(() => this.recalcularCosto());
    this.form.get('unitsPerBox')!.valueChanges.subscribe(() => this.recalcularCosto());
  }

  recalcularCosto(): void {
    const boxCost = this.form.get('boxCost')!.value;
    const unitsPerBox = this.form.get('unitsPerBox')!.value;
    if (boxCost > 0 && unitsPerBox > 0) {
      this.costoPorBotella = Math.round(boxCost / unitsPerBox);
      this.form.get('costPrice')!.setValue(this.costoPorBotella, { emitEvent: false });
    } else {
      this.costoPorBotella = null;
    }
  }

  get usandoCaja(): boolean {
    return !!this.form.get('boxCost')!.value && !!this.form.get('unitsPerBox')!.value;
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;

    const payload = { ...this.form.value };
    if (!payload.unitsPerBox) delete payload.unitsPerBox;
    if (!payload.boxCost) delete payload.boxCost;

    const accion = this.esEdicion
      ? this.productService.update(this.data.producto!.id, payload)
      : this.productService.create(payload);

    accion.subscribe({
      next: () => {
        this.snackBar.open(
          this.esEdicion ? 'Producto actualizado' : 'Producto creado',
          'Cerrar',
          { duration: 3000 },
        );
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.error || 'Error al guardar', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
