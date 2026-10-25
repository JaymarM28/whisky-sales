import { ReportsService } from './reports.service';
import { crearFakePrisma } from '../../test/fake-prisma';
import { escenario, T } from '../../test/escenario';

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(() => {
    service = new ReportsService(crearFakePrisma(escenario()));
  });

  it('getSocios: stock con traspasos y devoluciones, comisión y rendimiento', async () => {
    const { data } = await service.getSocios(T);
    const ana = data.find((s: any) => s.id === 'p1');
    expect(ana).toMatchObject({
      totalEntregado: 17,
      totalVendido: 7,
      totalPendiente: 1,
      totalDevuelto: 1,
      disponible: 6,
      rendimientoPct: 43.8,
      comisionGenerada: 90_000,
      comisionPagada: 50_000,
      comisionPendiente: 40_000,
    });
    expect(data.find((s: any) => s.id === 'p2')).toMatchObject({ disponible: 4, comisionGenerada: 16_000 });
    expect(data.some((s: any) => s.id === 'x1')).toBe(false);
  });

  it('getInventario: bodega, socios y total por producto', async () => {
    const { data } = await service.getInventario(T);
    const a = data.productos.find((p: any) => p.id === 'A');
    expect(a).toMatchObject({ totalComprado: 24, totalEntregado: 18, totalVendido: 10, enBodega: 7, enSocios: 7, disponible: 14 });
    expect(data.totales).toMatchObject({ totalEnBodega: 12, totalEnSocios: 10, totalInvertido: 2_900_000 });
  });

  it('getInventarioPorSocio: movimientos incluyen la devolución', async () => {
    const { data } = await service.getInventarioPorSocio(T);
    const ana = data.find((s: any) => s.socio.id === 'p1');
    expect(ana.totales).toEqual({ entregas: 17, ventasConf: 7, ventasPend: 1, traspasosOut: 2, traspasosIn: 0, devoluciones: 1, disponible: 6 });

    const movA = ana.productos.find((p: any) => p.producto.id === 'A').movimientos.map((m: any) => m.tipo);
    expect(movA).toEqual(['ENTREGA', 'TRASPASO_SALIDA', 'DEVOLUCION', 'VENTA_CONF', 'VENTA_CONF', 'VENTA_PEND']);
  });

  it('getVentas: agrupa por tipo de cliente con Negocio 2 como negocio', async () => {
    const { data } = await service.getVentas(T);
    expect(data.totalIngresos).toBe(180_000 * 3 + 150_000 * 2 + 160_000 * 4 + 90_000 * 2);
    expect(data.totalGanancia).toBe(660_000);
    const [consumidor, negocio] = data.porTipoCliente;
    expect(consumidor).toMatchObject({ totalVentas: 2, totalUnidades: 5 });
    expect(negocio).toMatchObject({ totalVentas: 2, totalUnidades: 6 });
  });

  it('getVentas: filtra por rango de fechas', async () => {
    const { data } = await service.getVentas(T, '2026-10-09', '2026-10-10');
    expect(data.totalVentas).toBe(2); // s5 y s6
  });
});
