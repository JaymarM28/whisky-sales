import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-pin',
  templateUrl: './forgot-pin.component.html',
  styleUrls: ['../auth-layout.css', './forgot-pin.component.css'],
})
export class ForgotPinComponent {
  form: FormGroup;
  enviando = false;
  enviado = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({
      cedula: ['', Validators.required],
    });
  }

  reintentar(): void {
    this.enviado = false;
  }

  enviar(): void {
    if (this.form.invalid) return;
    this.enviando = true;
    this.http.post(`${environment.apiUrl}/auth/forgot-pin`, this.form.value).subscribe({
      next: () => {
        this.enviado = true;
        this.enviando = false;
      },
      error: () => {
        this.enviado = true;
        this.enviando = false;
      },
    });
  }
}
