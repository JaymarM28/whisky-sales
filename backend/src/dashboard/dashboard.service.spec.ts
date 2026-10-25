import { DashboardService } from './dashboard.service';
import { InventoryService } from '../inventory/inventory.service';
import { crearFakePrisma } from '../../test/fake-prisma';
import { escenario, T } from '../../test/escenario';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    const prisma = crearFakePrisma(escenario());
    service = new DashboardService(prisma, new InventoryService(prisma));
  });

  describe('getOwnerDashboard', () => {
    it('calcula ventas, ganancias y comisiones del negocio', async () => {
      const { data } = await service.getOwnerDashboard(T);
      expect(data).toMatchObject({
        ventasPendientes: 1,
        ventasConfirmadas: 4,
        gananciaBruta: 660_000,
        comisionesGeneradas: 106_000,
        comisionesPagadas: 50_000,
        comisionesPendientes: 56_000,
        gananciaNeta: 610_000,
      });
    });

    it('separa ingresos por consumidor y negocio (incluye Negocio 2)', async () => {
      const { data } = await service.getOwnerDashboard(T);
      expect(data.ventasPorTipo).toEqual({
        consumidor: { count: 2, ingresos: 180_000 * 3 + 90_000 * 2 },
        negocio: { count: 2, ingresos: 150_000 * 2 + 160_000 * 4 },
      });
    });

    it('resume inventario global con compras y devoluciones', async () => {
      const { data } = await service.getOwnerDashboard(T);
      expect(data.inventarioGlobal).toEqual({
        totalComprado: 34,
        totalInvertido: 2_900_000,
        enBodega: 12,
        totalEntregado: 23,
        totalVendido: 11,
        totalDevuelto: 1,
        disponible: 11,
      });
    });

    it('lista el inventario por socio y producto', async () => {
      const { data } = await service.getOwnerDashboard(T);
      const filas = data.inventarioPorSocio.map((i: any) => [i.socio, i.producto, i.entregado, i.vendido, i.disponible]);
      expect(filas).toEqual(
        expect.arrayContaining([
          ['Ana', 'Whisky A', 12, 6, 3],
          ['Ana', 'Whisky B', 5, 2, 3],
          ['Beto', 'Whisky A', 6, 4, 4],
        ]),
      );
      expect(filas).toHaveLength(3);
    });
  });

  describe('getPartnerDashboard', () => {
    it('muestra al socio su inventario y sus ganancias', async () => {
      const { data } = await service.getPartnerDashboard('p1', T);
      expect(data.inventario.map((i: any) => [i.product.id, i.disponible])).toEqual([['A', 3], ['B', 3]]);
      expect(data).toMatchObject({
        comisionGenerada: 90_000,
        comisionPagada: 50_000,
        comisionPendiente: 40_000,
        comisionConsumidor: 80_000,
        comisionNegocio: 10_000,
        ventasPendientes: 1,
        ventasConfirmadas: 3,
        totalUnidadesVendidas: 7,
        rendimientoPct: 44, // 7 vendidas / (17 entregadas − 1 devuelta)
      });
    });

    it('no expone ingresos del negocio al socio', async () => {
      const { data } = await service.getPartnerDashboard('p1', T);
      expect(data).not.toHaveProperty('totalIngresos');
      expect(data).not.toHaveProperty('ingresoConsumidor');
      expect(data).not.toHaveProperty('ingresoNegocio');
    });

    it('lista las últimas ventas del socio, la más reciente primero', async () => {
      const { data } = await service.getPartnerDashboard('p1', T);
      expect(data.ultimasVentas.map((v: any) => v.id)).toEqual(['s6', 's4', 's3', 's2', 's1']);
    });
  });
});
