import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';

/** Tarjeta de Configuración para que cualquier usuario cambie su email de recuperación de PIN. */
@Component({
  selector: 'app-email-settings-card',
  templateUrl: './email-settings-card.component.html',
  styleUrls: ['./email-settings-card.component.css'],
})
export class EmailSettingsCardComponent implements OnInit {
  form: FormGroup;
  emailActual: string | null = null;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.userService.getMe().subscribe((res) => {
      this.emailActual = res.data?.email ?? null;
      this.form.patchValue({ email: this.emailActual ?? '' });
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando = true;

    this.userService.updateMyEmail(this.form.value.email).subscribe({
      next: (res) => {
        this.emailActual = res.data.email ?? null;
        this.form.reset({ email: this.emailActual ?? '' });
        this.snackBar.open('Email actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al actualizar el email', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
    });
  }
}
