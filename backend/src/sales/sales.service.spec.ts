import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { MailService } from '../mail/mail.service';
import { crearFakePrisma } from '../../test/fake-prisma';
import { escenario, T } from '../../test/escenario';

describe('SalesService', () => {
  let service: SalesService;
  let prisma: any;
  const mail = { notifyOwnerNewSale: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = crearFakePrisma(escenario());
    service = new SalesService(prisma, mail as unknown as MailService, new InventoryService(prisma));
  });

  describe('create', () => {
    const dto = { productId: 'A', quantity: 3, date: '2026-10-20' };

    it('no permite vender más de lo que tiene el socio (considera traspasos y devoluciones)', async () => {
      await expect(service.create({ ...dto, quantity: 4 }, 'p1', T)).rejects.toThrow(BadRequestException);
    });

    it('guarda snapshots de precios y deja la venta pendiente', async () => {
      const { data } = await service.create({ ...dto, clientType: 'BUSINESS_2' } as any, 'p1', T);
      expect(data).toMatchObject({ status: 'PENDING', clientType: 'BUSINESS_2', businessPrice2Snapshot: 150_000 });
      await expect(new InventoryService(prisma).getDisponible('p1', 'A', T)).resolves.toBe(0);
    });

    it('al socio no le devuelve el costo del negocio', async () => {
      const { data } = await service.create(dto, 'p1', T);
      expect(data).not.toHaveProperty('costPriceSnapshot');
    });

    it('notifica al dueño', async () => {
      await service.create(dto, 'p1', T);
      expect(mail.notifyOwnerNewSale).toHaveBeenCalledWith(expect.objectContaining({ ownerEmail: 'owner@test.com', quantity: 3 }));
    });

    it('no acepta productos de otro negocio', async () => {
      await expect(service.create({ ...dto, productId: 'X' }, 'p1', T)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('el socio solo ve sus ventas, aunque pida las de otro', async () => {
      const result = await service.findAll('p2', 'PARTNER', T, { partnerId: 'p1' });
      expect(result.data.map((s: any) => s.id)).toEqual(['s5']);
    });

    it('el dueño filtra por estado', async () => {
      const pendientes = await service.findAll('owner', 'OWNER', T, { status: 'PENDING' });
      expect(pendientes.data.map((s: any) => s.id)).toEqual(['s3']);

      const confirmadasAna = await service.findAll('owner', 'OWNER', T, { status: 'CONFIRMED', partnerId: 'p1' });
      expect(confirmadasAna.data.map((s: any) => s.id).sort()).toEqual(['s1', 's2', 's6']);
    });

    it('el dueño filtra por socio y fechas', async () => {
      const result = await service.findAll('owner', 'OWNER', T, { partnerId: 'p1', desde: '2026-10-06', hasta: '2026-10-08' });
      expect(result.data.map((s: any) => s.id).sort()).toEqual(['s2', 's3', 's4']);
    });
  });
});
