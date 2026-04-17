import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CommissionPayDialogComponent } from './commission-pay-dialog.component';
import { CommissionService } from '../../../../core/services/commission.service';

const mockSocios = [
  { id: 'p1', name: 'Leo', role: 'PARTNER', active: true, commissionPct: 20, createdAt: '' },
  { id: 'p2', name: 'Carlos', role: 'PARTNER', active: true, commissionPct: 15, createdAt: '' },
];

const mockCommissionService = {
  getPending: jasmine.createSpy('getPending').and.returnValue(
    of({ data: { pendiente: 38000, generada: 58000, pagada: 20000 }, error: null }),
  ),
  create: jasmine.createSpy('create').and.returnValue(
    of({ data: {}, error: null, message: 'Pago registrado' }),
  ),
};

const mockDialogRef = { close: jasmine.createSpy('close') };

describe('CommissionPayDialogComponent', () => {
  let component: CommissionPayDialogComponent;
  let fixture: ComponentFixture<CommissionPayDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommissionPayDialogComponent],
      imports: [ReactiveFormsModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: CommissionService, useValue: mockCommissionService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { socios: mockSocios } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommissionPayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('el formulario empieza vacío (sin socio seleccionado)', () => {
    expect(component.form.get('partnerId')?.value).toBe('');
    expect(component.pendienteInfo).toBeNull();
  });

  // ── Auto-fill comisión ────────────────────────────────────────────────────────

  describe('auto-fill al seleccionar socio', () => {
    it('llama getPending al seleccionar un socio', fakeAsync(() => {
      component.form.patchValue({ partnerId: 'p1' });
      tick();

      expect(mockCommissionService.getPending).toHaveBeenCalledWith('p1');
    }));

    it('rellena amount con el pendiente del socio', fakeAsync(() => {
      component.form.patchValue({ partnerId: 'p1' });
      tick();

      expect(component.form.get('amount')?.value).toBe(38000);
    }));

    it('guarda pendienteInfo con generada, pagada y pendiente', fakeAsync(() => {
      component.form.patchValue({ partnerId: 'p1' });
      tick();

      expect(component.pendienteInfo?.generada).toBe(58000);
      expect(component.pendienteInfo?.pagada).toBe(20000);
      expect(component.pendienteInfo?.pendiente).toBe(38000);
    }));

    it('no rellena amount si pendiente es 0', fakeAsync(() => {
      mockCommissionService.getPending.and.returnValue(
        of({ data: { pendiente: 0, generada: 40000, pagada: 40000 }, error: null }),
      );
      component.form.patchValue({ partnerId: 'p2' });
      tick();

      expect(component.form.get('amount')?.value).toBe('');
    }));
  });

  // ── Guardar ──────────────────────────────────────────────────────────────────

  describe('guardar', () => {
    it('no llama create si el formulario es inválido', () => {
      component.form.patchValue({ partnerId: '', amount: '' });
      component.guardar();
      expect(mockCommissionService.create).not.toHaveBeenCalled();
    });

    it('llama create y cierra con formulario válido', fakeAsync(() => {
      component.form.patchValue({
        partnerId: 'p1',
        amount: 38000,
        paymentReference: 'Nequi-123',
        date: '2026-04-01',
      });
      component.guardar();
      tick();

      expect(mockCommissionService.create).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('cancelar cierra el diálogo con null', () => {
      component.cancelar();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });
});
