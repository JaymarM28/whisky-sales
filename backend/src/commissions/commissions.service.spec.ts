import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  sale: { findMany: jest.fn() },
  commissionPayment: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
};

describe('CommissionsService', () => {
  let service: CommissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    jest.clearAllMocks();
  });

  // ── getPendingForPartner ──────────────────────────────────────────────────────

  describe('getPendingForPartner', () => {
    const partnerId = 'partner-1';

    it('lanza NotFoundException si el socio no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getPendingForPartner(partnerId)).rejects.toThrow(NotFoundException);
    });

    it('calcula comisión pendiente = generada - pagada', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ commissionPct: 20 });
      // 2 ventas: ganancia bruta = (100000-60000)*5 + (80000-50000)*3 = 200000 + 90000 = 290000
      // comisión generada = 290000 * 20% = 58000
      mockPrisma.sale.findMany.mockResolvedValue([
        { quantity: 5, product: { costPrice: 60000, salePrice: 100000 } },
        { quantity: 3, product: { costPrice: 50000, salePrice: 80000 } },
      ]);
      // pagada: 20000
      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: 20000 } });

      const result = await service.getPendingForPartner(partnerId);
      expect(result.data.generada).toBe(58000);
      expect(result.data.pagada).toBe(20000);
      expect(result.data.pendiente).toBe(38000);
    });

    it('pendiente es 0 cuando todo está pagado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ commissionPct: 20 });
      mockPrisma.sale.findMany.mockResolvedValue([
        { quantity: 5, product: { costPrice: 60000, salePrice: 100000 } },
      ]);
      const generada = (100000 - 60000) * 5 * 0.20; // 40000
      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: generada } });

      const result = await service.getPendingForPartner(partnerId);
      expect(result.data.pendiente).toBe(0);
    });

    it('pendiente es 0 si no hay ventas confirmadas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ commissionPct: 20 });
      mockPrisma.sale.findMany.mockResolvedValue([]);
      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      const result = await service.getPendingForPartner(partnerId);
      expect(result.data.generada).toBe(0);
      expect(result.data.pendiente).toBe(0);
    });

    it('usa solo ventas CONFIRMED para calcular comisión (no PENDING)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ commissionPct: 15 });
      // findMany está filtrado por status: 'CONFIRMED' en el servicio
      mockPrisma.sale.findMany.mockResolvedValue([
        { quantity: 10, product: { costPrice: 50000, salePrice: 70000 } },
      ]);
      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: null } });

      const result = await service.getPendingForPartner(partnerId);
      // (70000-50000) * 10 * 15% = 30000
      expect(result.data.generada).toBe(30000);
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'CONFIRMED' }),
        }),
      );
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lanza NotFoundException si el socio no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ partnerId: 'no-existe', amount: 50000, date: '2026-04-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('crea el pago correctamente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'partner-1', name: 'Leo' });
      const payment = { id: 'pay-1', partnerId: 'partner-1', amount: 50000, date: new Date(), partner: { id: 'partner-1', name: 'Leo' } };
      mockPrisma.commissionPayment.create.mockResolvedValue(payment);

      const result = await service.create({ partnerId: 'partner-1', amount: 50000, date: '2026-04-01' });
      expect(result.data.amount).toBe(50000);
      expect(result.error).toBeNull();
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('lanza NotFoundException si el pago no existe', async () => {
      mockPrisma.commissionPayment.findUnique.mockResolvedValue(null);
      await expect(service.remove('no-existe')).rejects.toThrow(NotFoundException);
    });

    it('elimina el pago correctamente', async () => {
      mockPrisma.commissionPayment.findUnique.mockResolvedValue({ id: 'pay-1' });
      mockPrisma.commissionPayment.delete.mockResolvedValue({});

      const result = await service.remove('pay-1');
      expect(mockPrisma.commissionPayment.delete).toHaveBeenCalledWith({ where: { id: 'pay-1' } });
      expect(result.error).toBeNull();
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('PARTNER solo ve sus propios pagos', async () => {
      mockPrisma.commissionPayment.findMany.mockResolvedValue([]);
      await service.findAll('partner-1', 'PARTNER');
      expect(mockPrisma.commissionPayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { partnerId: 'partner-1' } }),
      );
    });

    it('OWNER ve todos los pagos', async () => {
      mockPrisma.commissionPayment.findMany.mockResolvedValue([]);
      await service.findAll('owner-1', 'OWNER');
      expect(mockPrisma.commissionPayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });
});
