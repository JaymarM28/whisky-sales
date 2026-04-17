import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── isLoggedIn ────────────────────────────────────────────────────────────────

  describe('isLoggedIn', () => {
    it('retorna false cuando no hay token en localStorage', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('retorna true cuando hay token en localStorage', () => {
      localStorage.setItem('token', 'fake-token');
      expect(service.isLoggedIn()).toBeTrue();
    });
  });

  // ── currentUser ──────────────────────────────────────────────────────────────

  describe('currentUser', () => {
    it('retorna null cuando no hay usuario en localStorage', () => {
      expect(service.currentUser).toBeNull();
    });

    it('retorna el usuario almacenado en localStorage', () => {
      const user = { id: 'u1', name: 'Leo', role: 'PARTNER' };
      localStorage.setItem('user', JSON.stringify(user));
      // Recrear servicio para que lea el storage
      service = new (AuthService as any)(
        TestBed.inject(require('@angular/common/http').HttpClient),
        TestBed.inject(require('@angular/router').Router),
      );
      expect(service.currentUser?.name).toBe('Leo');
    });
  });

  // ── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('hace POST a /auth/login con userId y pin', () => {
      const response = { data: { token: 'jwt-123', user: { id: 'u1', name: 'Leo', role: 'PARTNER' } }, error: null, message: null };

      service.login('u1', '1234').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId: 'u1', pin: '1234' });
      req.flush(response);
    });

    it('guarda token y usuario en localStorage tras login exitoso', () => {
      const user = { id: 'u1', name: 'Leo', role: 'PARTNER' as const, active: true, commissionPct: 20, createdAt: '' };
      const response = { data: { token: 'jwt-abc', user }, error: null, message: null };

      service.login('u1', '1234').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(response);

      expect(localStorage.getItem('token')).toBe('jwt-abc');
      expect(JSON.parse(localStorage.getItem('user')!).name).toBe('Leo');
    });

    it('actualiza currentUser tras login exitoso', (done) => {
      const user = { id: 'u1', name: 'Leo', role: 'PARTNER' as const, active: true, commissionPct: 20, createdAt: '' };
      const response = { data: { token: 'jwt-abc', user }, error: null, message: null };

      service.login('u1', '1234').subscribe(() => {
        expect(service.currentUser?.name).toBe('Leo');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(response);
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('limpia localStorage al hacer logout', () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem('user', '{"id":"u1"}');

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('currentUser es null tras logout', () => {
      service.logout();
      expect(service.currentUser).toBeNull();
    });
  });

  // ── getPerfiles ──────────────────────────────────────────────────────────────

  describe('getPerfiles', () => {
    it('hace GET a /auth/profiles', () => {
      const profiles = { data: [{ id: 'u1', name: 'Leo', role: 'PARTNER' }], error: null, message: null };

      service.getPerfiles().subscribe((res: any) => {
        expect(res.data).toHaveSize(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profiles`);
      expect(req.request.method).toBe('GET');
      req.flush(profiles);
    });
  });
});
