import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryService } from '../../../../core/services/delivery.service';
import { User } from '../../../../shared/models/user.model';
import { Product } from '../../../../shared/models/product.model';

@Component({
  selector: 'app-delivery-form-dialog',
  templateUrl: './delivery-form-dialog.component.html',
  styleUrls: ['./delivery-form-dialog.component.css'],
})
export class DeliveryFormDialogComponent {
  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DeliveryFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socios: User[]; productos: Product[] },
  ) {
    this.form = this.fb.group({
      partnerId: ['', Validators.required],
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: [''],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;

    this.deliveryService.create(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Entrega registrada', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al registrar entrega', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
