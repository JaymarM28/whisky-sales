import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const pinesCoinciden = (group: AbstractControl): ValidationErrors | null =>
  group.get('newPin')?.value === group.get('confirmPin')?.value ? null : { noCoincide: true };

/** Marca "Confirmar PIN" en rojo también cuando el error es del grupo (PIN distintos). */
class ConfirmPinMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const tocado = !!control && (control.touched || !!form?.submitted);
    return tocado && (!!control?.invalid || !!form?.form.hasError('noCoincide'));
  }
}

@Component({
  selector: 'app-reset-pin',
  templateUrl: './reset-pin.component.html',
  styleUrls: ['../auth-layout.css', './reset-pin.component.css'],
})
export class ResetPinComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  exito = false;
  tokenInvalido = false;
  pinVisible = false;
  confirmMatcher = new ConfirmPinMatcher();
  private token = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {
    this.form = this.fb.group(
      {
        newPin: ['', [Validators.required, Validators.pattern(/^\d{4,6}$/)]],
        confirmPin: ['', Validators.required],
      },
      { validators: pinesCoinciden },
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.tokenInvalido = true;
  }

  guardar(): void {
    if (this.form.invalid || !this.token) return;
    this.guardando = true;
    this.http.post(`${environment.apiUrl}/auth/reset-pin`, {
      token: this.token,
      newPin: this.form.value.newPin,
    }).subscribe({
      next: () => {
        this.exito = true;
        this.guardando = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: () => {
        this.tokenInvalido = true;
        this.guardando = false;
      },
    });
  }
}
