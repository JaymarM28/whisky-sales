import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CommissionService } from './commission.service';
import { environment } from '../../../environments/environment';

describe('CommissionService', () => {
  let service: CommissionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/commissions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CommissionService],
    });
    service = TestBed.inject(CommissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll hace GET /commissions', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], error: null, message: null });
  });

  it('create hace POST /commissions con los datos correctos', () => {
    const data = { partnerId: 'p1', amount: 50000, date: '2026-04-01' };
    service.create(data).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush({ data: {}, error: null, message: null });
  });

  it('getPending hace GET /commissions/pending/:partnerId', () => {
    service.getPending('partner-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/pending/partner-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { pendiente: 25000, generada: 40000, pagada: 15000 }, error: null, message: null });
  });

  it('getPending retorna los valores de pendiente, generada y pagada', () => {
    let result: any;
    service.getPending('partner-1').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${apiUrl}/pending/partner-1`);
    req.flush({ data: { pendiente: 25000, generada: 40000, pagada: 15000 }, error: null, message: null });

    expect(result.data.pendiente).toBe(25000);
    expect(result.data.generada).toBe(40000);
    expect(result.data.pagada).toBe(15000);
  });

  it('remove hace DELETE /commissions/:id', () => {
    service.remove('pay-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/pay-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: null, error: null, message: null });
  });
});
