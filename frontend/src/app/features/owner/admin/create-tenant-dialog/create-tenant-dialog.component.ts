import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TenantService } from '../../../../core/services/tenant.service';

@Component({
  selector: 'app-create-tenant-dialog',
  templateUrl: './create-tenant-dialog.component.html',
})
export class CreateTenantDialogComponent implements OnInit {
  form!: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private tenantService: TenantService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CreateTenantDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    });

    // Auto-generar slug desde el nombre
    this.form.get('name')!.valueChanges.subscribe((name: string) => {
      const slug = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      this.form.get('slug')!.setValue(slug, { emitEvent: false });
    });
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    this.tenantService.create(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Negocio creado exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.guardando = false;
        const msg = err?.error?.message || 'Error al crear el negocio';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
      },
    });
  }

  cancelar(): void { this.dialogRef.close(null); }
}
