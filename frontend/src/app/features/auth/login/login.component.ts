import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  cargando = false;
  pinVisible = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      cedula: ['', [Validators.required]],
      pin: ['', [Validators.required, Validators.minLength(4)]],
    });

    if (this.authService.isLoggedIn()) {
      this.redirigir();
    }
  }

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const cedula = (this.form.value.cedula as string).trim();
    const pin: string = this.form.value.pin;

    this.authService.login(cedula, pin).subscribe({
      next: () => this.redirigir(),
      error: (err) => {
        this.cargando = false;
        const msg = err?.error?.message || 'Credenciales incorrectas';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  private redirigir(): void {
    const user = this.authService.currentUser;
    const route = user?.role === 'OWNER' ? ['/owner/dashboard'] : ['/partner/dashboard'];
    this.router.navigate(route)
      .then((navigated) => { if (!navigated) this.cargando = false; })
      .catch(() => { this.cargando = false; });
  }
}
