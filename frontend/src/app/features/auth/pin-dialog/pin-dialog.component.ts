import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-pin-dialog',
  templateUrl: './pin-dialog.component.html',
  styleUrls: ['./pin-dialog.component.css'],
})
export class PinDialogComponent {
  form: FormGroup;
  ocultarPin = true;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PinDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario: User },
  ) {
    this.form = this.fb.group({
      pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
    });
  }

  ingresar(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.pin);
    }
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
