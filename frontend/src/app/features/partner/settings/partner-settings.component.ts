import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-partner-settings',
  templateUrl: './partner-settings.component.html',
  styleUrls: ['./partner-settings.component.css'],
})
export class PartnerSettingsComponent {
  form: FormGroup;
  guardando = false;
  ocultarPin = true;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      pin: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;

    this.userService.updateMyPin(this.form.value.pin).subscribe({
      next: () => {
        this.snackBar.open('PIN actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.form.reset();
        this.guardando = false;
      },
      error: () => {
        this.snackBar.open('Error al actualizar el PIN', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
    });
  }
}
