import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransferService } from '../../../../core/services/transfer.service';

@Component({
  selector: 'app-transfer-dialog',
  templateUrl: './transfer-dialog.component.html',
})
export class TransferDialogComponent implements OnInit {
  form!: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private transferService: TransferService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<TransferDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socios: { id: string; name: string }[]; inventario: any[] },
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      toPartnerId: ['', Validators.required],
      productId:   ['', Validators.required],
      quantity:    [1,  [Validators.required, Validators.min(1)]],
      date:        [new Date().toISOString().split('T')[0], Validators.required],
      notes:       [''],
    });
  }

  get disponible(): number {
    const productId = this.form.value.productId;
    if (!productId) return 0;
    const item = this.data.inventario.find((i: any) => i.product.id === productId);
    return item ? item.available : 0;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    this.transferService.create(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Traspaso registrado', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando = false;
        const msg = err?.error?.message || 'Error al registrar traspaso';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
