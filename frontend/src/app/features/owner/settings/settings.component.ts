import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  form: FormGroup;
  guardando = false;
  ocultarPin = true;
  ocultarPinNuevo = true;

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

    const userId = this.authService.currentUser!.id;
    this.userService.update(userId, { pin: this.form.value.pin }).subscribe({
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
