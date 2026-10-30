import { InventoryService } from './inventory.service';
import { crearFakePrisma } from '../../test/fake-prisma';
import { escenario, T } from '../../test/escenario';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService(crearFakePrisma(escenario()));
  });

  it('getDisponible descuenta ventas, traspasos y devoluciones', async () => {
    await expect(service.getDisponible('p1', 'A', T)).resolves.toBe(3);
    await expect(service.getDisponible('p1', 'B', T)).resolves.toBe(3);
    await expect(service.getDisponible('p2', 'A', T)).resolves.toBe(4);
  });

  it('getMovimientos detalla cada concepto', async () => {
    await expect(service.getMovimientos('p1', 'A', T)).resolves.toEqual({
      entregado: 12, vendido: 6, traspasoSalida: 2, traspasoEntrada: 0, devuelto: 1, perdido: 0, disponible: 3,
    });
  });

  it('getByPartner lista solo productos con actividad', async () => {
    const { data } = await service.getByPartner('p2', T);
    expect(data.map((i: any) => [i.product.id, i.available])).toEqual([['A', 4]]);
  });

  it('getAll agrupa por socio y no mezcla otros negocios', async () => {
    const { data } = await service.getAll(T);
    const resumen = Object.fromEntries(
      data.map((s: any) => [s.partner.id, s.inventory.map((i: any) => [i.product.id, i.available])]),
    );
    expect(resumen).toEqual({ p1: [['A', 3], ['B', 3]], p2: [['A', 4]] });
  });
});
