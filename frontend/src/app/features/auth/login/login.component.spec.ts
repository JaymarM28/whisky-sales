import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

const mockPerfiles: User[] = [
  { id: 'u1', name: 'Leo', role: 'PARTNER', active: true, commissionPct: 20, createdAt: '' },
  { id: 'u2', name: 'Jay', role: 'OWNER', active: true, commissionPct: 0, createdAt: '' },
];

const mockAuthService = {
  isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
  currentUser: null,
  getPerfiles: jasmine.createSpy('getPerfiles').and.returnValue(of({ data: mockPerfiles, error: null })),
  login: jasmine.createSpy('login'),
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
  });

  afterEach(() => {
    mockAuthService.isLoggedIn.calls.reset();
    mockAuthService.getPerfiles.calls.reset();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('carga los perfiles al iniciar', () => {
    expect(mockAuthService.getPerfiles).toHaveBeenCalled();
    expect(component.usuarios).toHaveSize(2);
  });

  it('cargando pasa a false tras cargar perfiles', () => {
    expect(component.cargando).toBeFalse();
  });

  it('muestra error en snackbar si falla la carga de perfiles', () => {
    mockAuthService.getPerfiles.and.returnValue(throwError(() => new Error('error')));
    const snackBar = TestBed.inject(require('@angular/material/snack-bar').MatSnackBar);
    spyOn(snackBar, 'open');

    component.ngOnInit();

    expect(snackBar.open).toHaveBeenCalledWith('Error al cargar los perfiles', 'Cerrar', jasmine.any(Object));
  });

  it('dialogOpen evita abrir el diálogo dos veces seguidas', () => {
    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(null) } as any);

    component.seleccionarUsuario(mockPerfiles[0]);
    component.seleccionarUsuario(mockPerfiles[0]); // segunda llamada debe ser ignorada

    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('getInicial retorna la primera letra en mayúscula', () => {
    expect(component.getInicial('leo')).toBe('L');
    expect(component.getInicial('Ana')).toBe('A');
  });

  it('getInicial retorna ? para nombre vacío', () => {
    expect(component.getInicial('')).toBe('?');
  });
});
