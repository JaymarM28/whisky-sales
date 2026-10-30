import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StockLossService } from '../../../../core/services/stock-loss.service';
import { InventoryService } from '../../../../core/services/inventory.service';
import { PurchaseService } from '../../../../core/services/purchase.service';
import { User } from '../../../../shared/models/user.model';
import { Product } from '../../../../shared/models/product.model';

interface Disponible {
  id: string;
  name: string;
  cantidad: number;
}

@Component({
  selector: 'app-loss-form-dialog',
  templateUrl: './loss-form-dialog.component.html',
  styleUrls: ['./loss-form-dialog.component.css'],
})
export class LossFormDialogComponent {
  form: FormGroup;
  guardando = false;
  cargando = false;
  /** Productos disponibles en el lugar elegido (bodega o socio) y cuántas unidades hay. */
  disponibles: Disponible[] = [];

  opcionesAsume = [
    { valor: 0, label: 'El negocio' },
    { valor: 50, label: 'Mitad y mitad' },
    { valor: 100, label: 'El socio' },
    { valor: -1, label: 'Otro porcentaje' },
  ];

  constructor(
    private fb: FormBuilder,
    private lossService: StockLossService,
    private inventoryService: InventoryService,
    private purchaseService: PurchaseService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<LossFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socios: User[]; productos: Product[] },
  ) {
    this.form = this.fb.group({
      origen: ['bodega', Validators.required],
      partnerId: [''],
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      asume: [50],
      pctPersonalizado: [50, [Validators.min(0), Validators.max(100)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: [''],
    });
    this.cargarBodega();
  }

  get enSocio(): boolean {
    return this.form.value.origen === 'socio';
  }

  get disponible(): number | null {
    return this.disponibles.find((d) => d.id === this.form.value.productId)?.cantidad ?? null;
  }

  get excede(): boolean {
    return this.disponible !== null && this.form.value.quantity > this.disponible;
  }

  /** Porcentaje del costo que asume el socio. */
  get pctSocio(): number {
    if (!this.enSocio) return 0;
    const asume = Number(this.form.value.asume);
    return asume === -1 ? Number(this.form.value.pctPersonalizado) || 0 : asume;
  }

  get valor(): number {
    const costo = this.data.productos.find((p) => p.id === this.form.value.productId)?.costPrice ?? 0;
    return costo * (Number(this.form.value.quantity) || 0);
  }

  get cargoSocio(): number {
    return Math.round((this.valor * this.pctSocio) / 100);
  }

  onOrigenChange(): void {
    this.form.patchValue({ partnerId: '', productId: '' });
    this.disponibles = [];
    const socio = this.form.get('partnerId')!;
    if (this.enSocio) {
      socio.setValidators(Validators.required);
    } else {
      socio.clearValidators();
      this.cargarBodega();
    }
    socio.updateValueAndValidity();
  }

  onSocioChange(): void {
    this.form.patchValue({ productId: '' });
    this.disponibles = [];
    this.cargando = true;
    this.inventoryService.getByPartner(this.form.value.partnerId).subscribe({
      next: (res) => {
        this.disponibles = (res.data as any[])
          .filter((i) => i.available > 0)
          .map((i) => ({ id: i.product.id, name: i.product.name, cantidad: i.available }));
        this.cargando = false;
      },
      error: () => this.errorCarga(),
    });
  }

  private cargarBodega(): void {
    this.cargando = true;
    this.purchaseService.getStock().subscribe({
      next: (res) => {
        this.disponibles = res.data.productos
          .filter((s) => s.enBodega > 0)
          .map((s) => ({ id: s.product.id, name: s.product.name, cantidad: s.enBodega }));
        this.cargando = false;
      },
      error: () => this.errorCarga(),
    });
  }

  private errorCarga(): void {
    this.snackBar.open('Error al cargar el inventario', 'Cerrar', { duration: 3000 });
    this.cargando = false;
  }

  guardar(): void {
    if (this.form.invalid || this.excede) return;
    this.guardando = true;

    const { partnerId, productId, quantity, date, notes } = this.form.value;
    this.lossService
      .create({
        productId,
        quantity,
        date,
        notes: notes || undefined,
        ...(this.enSocio && { partnerId, partnerSharePct: this.pctSocio }),
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Pérdida registrada', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Error al registrar la pérdida', 'Cerrar', { duration: 4000 });
          this.guardando = false;
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
