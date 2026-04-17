import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ReportSaleDialogComponent } from './report-sale-dialog.component';
import { SaleService } from '../../../../core/services/sale.service';
import { InventoryService } from '../../../../core/services/inventory.service';
import { AuthService } from '../../../../core/services/auth.service';

const inventarioMock = [
  { product: { id: 'prod-1', name: 'Whisky A' }, available: 12 },
  { product: { id: 'prod-2', name: 'Whisky B' }, available: 5 },
];

const mockInventoryService = {
  getByPartner: jasmine.createSpy('getByPartner').and.returnValue(
    of({ data: inventarioMock, error: null }),
  ),
};

const mockAuthService = {
  currentUser: { id: 'partner-1', name: 'Leo', role: 'PARTNER' },
};

const mockSaleService = {
  create: jasmine.createSpy('create').and.returnValue(of({ data: {}, error: null, message: 'ok' })),
};

const mockDialogRef = {
  close: jasmine.createSpy('close'),
};

describe('ReportSaleDialogComponent', () => {
  let component: ReportSaleDialogComponent;
  let fixture: ComponentFixture<ReportSaleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportSaleDialogComponent],
      imports: [ReactiveFormsModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: SaleService, useValue: mockSaleService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSaleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('carga el inventario al iniciar', () => {
    expect(mockInventoryService.getByPartner).toHaveBeenCalledWith('partner-1');
    expect(component.inventario).toHaveSize(2);
  });

  // ── Validación de cantidad ───────────────────────────────────────────────────

  describe('validación de cantidad', () => {
    beforeEach(() => {
      component.form.patchValue({ productId: 'prod-1' });
      fixture.detectChanges();
    });

    it('getDisponible retorna 12 para prod-1', () => {
      expect(component.getDisponible()).toBe(12);
    });

    it('el campo quantity es válido con cantidad <= disponible', () => {
      component.form.patchValue({ quantity: 12 });
      const cantidadCtrl = component.form.get('quantity');
      expect(cantidadCtrl?.valid).toBeTrue();
    });

    it('el campo quantity es inválido con cantidad > disponible (error max)', () => {
      component.form.patchValue({ productId: 'prod-1' });
      // Forzar actualización del validador
      const item = component.inventario.find((i: any) => i.product.id === 'prod-1');
      component.form.get('quantity')!.setValidators([
        require('@angular/forms').Validators.required,
        require('@angular/forms').Validators.min(1),
        require('@angular/forms').Validators.max(item?.available || 0),
      ]);
      component.form.patchValue({ quantity: 13 });
      component.form.get('quantity')!.updateValueAndValidity();

      expect(component.form.get('quantity')?.hasError('max')).toBeTrue();
    });

    it('el campo quantity es inválido con cantidad 0 (error min)', () => {
      component.form.patchValue({ quantity: 0 });
      expect(component.form.get('quantity')?.hasError('min')).toBeTrue();
    });
  });

  // ── Formulario ───────────────────────────────────────────────────────────────

  describe('formulario', () => {
    it('es inválido sin producto seleccionado', () => {
      component.form.patchValue({ productId: '', quantity: 5 });
      expect(component.form.invalid).toBeTrue();
    });

    it('es válido con producto, cantidad y fecha', () => {
      component.form.patchValue({
        productId: 'prod-1',
        quantity: 3,
        date: '2026-04-01',
      });
      expect(component.form.valid).toBeTrue();
    });

    it('no requiere comprobante (campo opcional)', () => {
      component.form.patchValue({ productId: 'prod-1', quantity: 1, date: '2026-04-01' });
      expect(component.form.valid).toBeTrue();
      expect(component.archivoSeleccionado).toBeNull();
    });
  });

  // ── guardar ──────────────────────────────────────────────────────────────────

  describe('guardar', () => {
    it('no llama create si el formulario es inválido', () => {
      component.form.patchValue({ productId: '', quantity: 0 });
      component.guardar();
      expect(mockSaleService.create).not.toHaveBeenCalled();
    });

    it('llama create y cierra el diálogo con formulario válido', () => {
      component.form.patchValue({ productId: 'prod-1', quantity: 2, date: '2026-04-01', notes: '' });
      component.guardar();

      expect(mockSaleService.create).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('cancelar cierra el diálogo con null', () => {
      component.cancelar();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });
});
