import { BadRequestException } from '@nestjs/common';
import { LossesService } from './losses.service';
import { InventoryService } from '../inventory/inventory.service';
import { PurchasesService } from '../purchases/purchases.service';
import { CommissionsService } from '../commissions/commissions.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { MailService } from '../mail/mail.service';
import { crearFakePrisma } from '../../test/fake-prisma';
import { escenario, T } from '../../test/escenario';

describe('LossesService', () => {
  let prisma: any;
  let inventory: InventoryService;
  let purchases: PurchasesService;
  let service: LossesService;

  beforeEach(() => {
    prisma = crearFakePrisma(escenario());
    inventory = new InventoryService(prisma);
    purchases = new PurchasesService(prisma);
    service = new LossesService(prisma, inventory, purchases);
  });

  describe('pérdida en manos de un socio', () => {
    it('descuenta del inventario del socio y valora al costo actual', async () => {
      const { data } = await service.create({ productId: 'A', partnerId: 'p1', quantity: 1, partnerSharePct: 50, date: '2026-10-28' }, T);

      expect(data).toMatchObject({ unitCost: 100_000, valor: 100_000, cargoSocio: 50_000 });
      await expect(inventory.getDisponible('p1', 'A', T)).resolves.toBe(2);
    });

    it('la parte del socio se descuenta de su comisión pendiente', async () => {
      await service.create({ productId: 'A', partnerId: 'p1', quantity: 1, partnerSharePct: 50, date: '2026-10-28' }, T);

      const comisiones = new CommissionsService(prisma, {} as MailService);
      const { data } = await comisiones.getPendingForPartner('p1', T);
      // 90.000 generada − 50.000 pagada − 50.000 de la botella
      expect(data).toEqual({ generada: 90_000, pagada: 50_000, cargosPerdidas: 50_000, pendiente: -10_000 });
    });

    it('si la asume el negocio, no afecta la comisión', async () => {
      await service.create({ productId: 'A', partnerId: 'p1', quantity: 1, partnerSharePct: 0, date: '2026-10-28' }, T);
      const { data } = await new CommissionsService(prisma, {} as MailService).getPendingForPartner('p1', T);
      expect(data.pendiente).toBe(40_000);
    });

    it('no permite perder más de lo que tiene el socio', async () => {
      await expect(
        service.create({ productId: 'A', partnerId: 'p1', quantity: 4, partnerSharePct: 50, date: '2026-10-28' }, T),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('pérdida en bodega', () => {
    it('descuenta de la bodega', async () => {
      await service.create({ productId: 'A', quantity: 2, date: '2026-10-28' }, T);
      await expect(purchases.getStockBodega('A', T)).resolves.toBe(5);
    });

    it('no admite porcentaje del socio', async () => {
      await expect(service.create({ productId: 'A', quantity: 1, partnerSharePct: 50, date: '2026-10-28' }, T)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('no permite perder más de lo que hay en bodega', async () => {
      await expect(service.create({ productId: 'A', quantity: 8, date: '2026-10-28' }, T)).rejects.toThrow(BadRequestException);
    });
  });

  it('el dashboard del dueño resta las pérdidas de la ganancia neta', async () => {
    await service.create({ productId: 'A', partnerId: 'p1', quantity: 1, partnerSharePct: 50, date: '2026-10-28' }, T);
    await service.create({ productId: 'A', quantity: 2, date: '2026-10-28' }, T);

    const { data } = await new DashboardService(prisma, inventory).getOwnerDashboard(T);

    // 660.000 bruta − 50.000 comisiones pagadas − 300.000 en pérdidas (3 botellas × 100.000)
    expect(data.gananciaNeta).toBe(310_000);
    expect(data.perdidas).toEqual({ unidades: 3, valor: 300_000, asumidoSocios: 50_000, asumidoNegocio: 250_000 });
    // 56.000 pendientes − 50.000 que le corresponden a Ana por la botella
    expect(data.comisionesPendientes).toBe(6_000);
    expect(data.inventarioGlobal).toMatchObject({ enBodega: 10, disponible: 10, totalPerdido: 3 });
  });

  it('eliminar una pérdida devuelve las unidades y anula el cargo', async () => {
    const { data } = await service.create({ productId: 'A', partnerId: 'p1', quantity: 1, partnerSharePct: 100, date: '2026-10-28' }, T);
    await service.remove(data.id, T);
    await expect(inventory.getDisponible('p1', 'A', T)).resolves.toBe(3);
  });

  it('lista con el resumen del filtro', async () => {
    await service.create({ productId: 'A', partnerId: 'p1', quantity: 1, partnerSharePct: 50, date: '2026-10-28' }, T);
    await service.create({ productId: 'B', quantity: 1, date: '2026-10-28' }, T);
    const { resumen } = await service.findAll(T);
    expect(resumen).toEqual({ unidades: 2, valor: 150_000, asumidoSocios: 50_000, asumidoNegocio: 100_000 });
  });
});
