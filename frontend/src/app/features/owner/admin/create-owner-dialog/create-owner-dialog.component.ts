import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { Tenant } from '../../../../core/services/tenant.service';

@Component({
  selector: 'app-create-owner-dialog',
  templateUrl: './create-owner-dialog.component.html',
})
export class CreateOwnerDialogComponent implements OnInit {
  form!: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CreateOwnerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tenants: Tenant[] },
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tenantId: ['', [Validators.required]],
      name: ['', [Validators.required]],
      cedula: ['', [Validators.required]],
      pin: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    this.userService.create({ ...this.form.value, role: 'OWNER' }).subscribe({
      next: () => {
        this.snackBar.open('Owner creado exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.guardando = false;
        const msg = err?.error?.message || 'Error al crear el owner';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
      },
    });
  }

  cancelar(): void { this.dialogRef.close(null); }
}
