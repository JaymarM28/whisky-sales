import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SaleService } from './sale.service';
import { environment } from '../../../environments/environment';

describe('SaleService', () => {
  let service: SaleService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/sales`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SaleService],
    });
    service = TestBed.inject(SaleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll hace GET /sales', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], error: null, message: null });
  });

  it('create hace POST /sales con FormData', () => {
    const formData = new FormData();
    formData.append('productId', 'prod-1');
    formData.append('quantity', '5');

    service.create(formData).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush({ data: {}, error: null, message: null });
  });

  it('updateStatus hace PATCH /sales/:id/status', () => {
    service.updateStatus('sale-1', 'CONFIRMED').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/sale-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'CONFIRMED' });
    req.flush({ data: {}, error: null, message: null });
  });

  it('remove hace DELETE /sales/:id', () => {
    service.remove('sale-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/sale-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: null, error: null, message: null });
  });
});
