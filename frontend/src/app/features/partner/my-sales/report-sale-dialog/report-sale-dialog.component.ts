import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SaleService } from '../../../../core/services/sale.service';
import { InventoryService } from '../../../../core/services/inventory.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-report-sale-dialog',
  templateUrl: './report-sale-dialog.component.html',
  styleUrls: ['./report-sale-dialog.component.css'],
})
export class ReportSaleDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  inventario: any[] = [];
  archivoSeleccionado: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ReportSaleDialogComponent>,
  ) {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      clientType: ['CONSUMER', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: [''],
    });
  }

  ngOnInit(): void {
    const userId = this.authService.currentUser!.id;
    this.inventoryService.getByPartner(userId).subscribe({
      next: (res) => {
        this.inventario = res.data.filter((i: any) => i.available > 0);
      },
    });

    this.form.get('productId')!.valueChanges.subscribe((productId: string) => {
      const item = this.inventario.find((i: any) => i.product.id === productId);
      const disponible: number = item ? item.available : 0;
      const cantidadCtrl = this.form.get('quantity')!;
      cantidadCtrl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(disponible),
      ]);
      cantidadCtrl.updateValueAndValidity();
    });
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const archivo = input.files[0];
    if (!['image/jpeg', 'image/png'].includes(archivo.type)) {
      this.snackBar.open('Solo se permiten imágenes JPEG o PNG', 'Cerrar', { duration: 3000 });
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.snackBar.open('La imagen no puede superar 5 MB', 'Cerrar', { duration: 3000 });
      return;
    }

    this.archivoSeleccionado = archivo;

    const reader = new FileReader();
    reader.onload = (e) => (this.previewUrl = e.target?.result as string);
    reader.readAsDataURL(archivo);
  }

  guardar(): void {
    if (this.form.invalid) return;

    this.guardando = true;

    const formData = new FormData();
    formData.append('productId', this.form.value.productId);
    formData.append('quantity', this.form.value.quantity.toString());
    formData.append('date', this.form.value.date);
    formData.append('clientType', this.form.value.clientType);
    if (this.form.value.notes) formData.append('notes', this.form.value.notes);
    if (this.archivoSeleccionado) formData.append('receiptImage', this.archivoSeleccionado);

    this.saleService.create(formData).subscribe({
      next: () => {
        this.snackBar.open('Venta reportada exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al reportar venta', 'Cerrar', { duration: 3000 });
        this.guardando = false;
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  getDisponible(): number {
    const productId = this.form.value.productId;
    const item = this.inventario.find((i: any) => i.product.id === productId);
    return item?.available || 0;
  }

  getProductoSeleccionado(): any {
    const productId = this.form.value.productId;
    return this.inventario.find((i: any) => i.product.id === productId)?.product || null;
  }

  getPrecioEfectivo(): number | null {
    const producto = this.getProductoSeleccionado();
    if (!producto) return null;
    const clientType = this.form.value.clientType;
    if (clientType === 'BUSINESS' && producto.businessPrice > 0) return producto.businessPrice;
    if (clientType === 'BUSINESS_2' && producto.businessPrice2 > 0) return producto.businessPrice2;
    if (clientType === 'BUSINESS_3' && producto.businessPrice3 > 0) return producto.businessPrice3;
    return producto.salePrice;
  }

  tieneNegocio(nivel: 1 | 2 | 3): boolean {
    const producto = this.getProductoSeleccionado();
    if (!producto) return false;
    if (nivel === 1) return producto.businessPrice > 0;
    if (nivel === 2) return producto.businessPrice2 > 0;
    return producto.businessPrice3 > 0;
  }
}
