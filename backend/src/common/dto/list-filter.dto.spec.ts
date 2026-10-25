import { ValidationPipe } from '@nestjs/common';
import { ListFilterDto, rangoFechas } from './list-filter.dto';

// Misma configuración que main.ts
const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
const validar = (query: object) => pipe.transform(query, { type: 'query', metatype: ListFilterDto });

describe('ListFilterDto', () => {
  it('acepta los filtros declarados (antes la API rechazaba partnerId/productId con 400)', async () => {
    const r = await validar({ page: '2', partnerId: 'p1', productId: 'x1', desde: '2026-10-01', hasta: '2026-10-31' });
    expect(r).toMatchObject({ page: 2, partnerId: 'p1', productId: 'x1' });
  });

  it('rechaza fechas inválidas', async () => {
    await expect(validar({ desde: 'ayer' })).rejects.toBeDefined();
  });
});

describe('rangoFechas', () => {
  it('sin fechas no filtra', () => {
    expect(rangoFechas()).toEqual({});
  });

  it('incluye el día "hasta" completo', () => {
    const { date } = rangoFechas('2026-10-01', '2026-10-31') as any;
    expect(date.gte).toEqual(new Date('2026-10-01'));
    expect(date.lte).toEqual(new Date('2026-10-31T23:59:59.999Z'));
  });
});
