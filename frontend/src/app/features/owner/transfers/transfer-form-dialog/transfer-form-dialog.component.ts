import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransferService } from '../../../../core/services/transfer.service';
import { UserService } from '../../../../core/services/user.service';
import { ProductService } from '../../../../core/services/product.service';
import { User } from '../../../../shared/models/user.model';
import { Product } from '../../../../shared/models/product.model';

@Component({
  selector: 'app-transfer-form-dialog',
  templateUrl: './transfer-form-dialog.component.html',
})
export class TransferFormDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  socios: User[] = [];
  productos: Product[] = [];

  constructor(
    private fb: FormBuilder,
    private transferService: TransferService,
    private userService: UserService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TransferFormDialogComponent>,
  ) {
    this.form = this.fb.group({
      fromPartnerId: ['', Validators.required],
      toPartnerId:   ['', Validators.required],
      productId:     ['', Validators.required],
      quantity:      [1, [Validators.required, Validators.min(1)]],
      date:          [new Date().toISOString().substring(0, 10), Validators.required],
      notes:         [''],
    });
  }

  ngOnInit(): void {
    this.userService.getAll().subscribe({
      next: (res) => {
        this.socios = res.data.filter((u) => u.active);
      },
      error: () => {
        this.snackBar.open('Error al cargar socios', 'Cerrar', { duration: 3000 });
      },
    });
    this.productService.getAll(1, 100).subscribe({
      next: (res) => {
        this.productos = res.data.filter((p) => p.active);
      },
      error: () => {
        this.snackBar.open('Error al cargar productos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  get sociosDestino(): User[] {
    const fromId = this.form.value.fromPartnerId;
    return this.socios.filter((s) => s.id !== fromId);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;
    this.transferService.create(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Traspaso registrado', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al registrar traspaso', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
