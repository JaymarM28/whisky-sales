import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-partner-form-dialog',
  templateUrl: './partner-form-dialog.component.html',
  styleUrls: ['./partner-form-dialog.component.css'],
})
export class PartnerFormDialogComponent implements OnInit {
  form!: FormGroup;
  esEdicion = false;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PartnerFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socio?: User },
  ) {}

  ngOnInit(): void {
    this.esEdicion = !!this.data.socio;

    this.form = this.fb.group({
      name: [this.data.socio?.name || '', [Validators.required]],
      cedula: [
        this.data.socio?.cedula || '',
        this.esEdicion ? [] : [Validators.required],
      ],
      pin: ['', this.esEdicion ? [] : [Validators.required, Validators.minLength(4)]],
      commissionPct: [
        this.data.socio?.commissionPct ?? 20,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;

    const datos = this.form.value;
    if (!datos.pin) delete datos.pin;

    const accion = this.esEdicion
      ? this.userService.update(this.data.socio!.id, datos)
      : this.userService.create(datos);

    accion.subscribe({
      next: () => {
        this.snackBar.open(
          this.esEdicion ? 'Socio actualizado' : 'Socio creado',
          'Cerrar',
          { duration: 3000 },
        );
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Error al guardar el socio', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
