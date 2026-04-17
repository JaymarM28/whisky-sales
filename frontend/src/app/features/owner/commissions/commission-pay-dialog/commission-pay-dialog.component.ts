import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommissionService } from '../../../../core/services/commission.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-commission-pay-dialog',
  templateUrl: './commission-pay-dialog.component.html',
  styleUrls: ['./commission-pay-dialog.component.css'],
})
export class CommissionPayDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  cargandoPendiente = false;
  pendienteInfo: { pendiente: number; generada: number; pagada: number } | null = null;

  constructor(
    private fb: FormBuilder,
    private commissionService: CommissionService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CommissionPayDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socios: User[] },
  ) {
    this.form = this.fb.group({
      partnerId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentReference: [''],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
    });
  }

  ngOnInit(): void {
    this.form.get('partnerId')!.valueChanges.subscribe((partnerId: string) => {
      this.pendienteInfo = null;
      if (!partnerId) return;

      this.cargandoPendiente = true;
      this.commissionService.getPending(partnerId).subscribe({
        next: (res) => {
          this.pendienteInfo = res.data;
          if (res.data.pendiente > 0) {
            this.form.patchValue({ amount: res.data.pendiente });
          } else {
            this.form.patchValue({ amount: '' });
          }
          this.cargandoPendiente = false;
        },
        error: () => {
          this.cargandoPendiente = false;
        },
      });
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;

    this.commissionService.create(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Pago registrado', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al registrar pago', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
