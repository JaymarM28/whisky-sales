import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  sale: { count: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
  user: { findMany: jest.fn(), findUnique: jest.fn() },
  product: { findMany: jest.fn() },
  delivery: { aggregate: jest.fn() },
  commissionPayment: { aggregate: jest.fn() },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  // ── getOwnerDashboard ─────────────────────────────────────────────────────────

  describe('getOwnerDashboard', () => {
    it('calcula gananciaBruta correctamente', async () => {
      mockPrisma.sale.count.mockResolvedValue(3);
      // 2 ventas confirmadas: (100k-60k)*5 = 200k | (80k-50k)*2 = 60k → bruta = 260k
      mockPrisma.sale.findMany.mockResolvedValue([
        { quantity: 5, product: { costPrice: 60000, salePrice: 100000 } },
        { quantity: 2, product: { costPrice: 50000, salePrice: 80000 } },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 20 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 7 } });

      const result = await service.getOwnerDashboard();
      expect(result.data.gananciaBruta).toBe(260000);
    });

    it('calcula gananciaNeta = gananciaBruta - comisiones pagadas', async () => {
      mockPrisma.sale.count.mockResolvedValue(0);
      // bruta = (100k-60k)*10 = 400k
      mockPrisma.sale.findMany.mockResolvedValue([
        { quantity: 10, product: { costPrice: 60000, salePrice: 100000 } },
      ]);
      // 1 socio, 20% comisión → generada = 80k, pagada = 50k
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'p1', name: 'Leo', commissionPct: 20 }]);

      // Para el socio: findMany de ventas (mismo mock)
      mockPrisma.sale.findMany
        .mockResolvedValueOnce([{ quantity: 10, product: { costPrice: 60000, salePrice: 100000 } }]) // owner global
        .mockResolvedValueOnce([{ quantity: 10, product: { costPrice: 60000, salePrice: 100000 } }]); // socio

      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: 50000 } });
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

      const result = await service.getOwnerDashboard();
      // gananciaBruta = 400k, comisiones pagadas = 50k → neta = 350k
      expect(result.data.gananciaNeta).toBe(result.data.gananciaBruta - 50000);
    });

    it('calcula comisionesPendientes = generadas - pagadas', async () => {
      mockPrisma.sale.count.mockResolvedValue(2);
      mockPrisma.sale.findMany
        .mockResolvedValueOnce([]) // ventas globales (gananciaBruta = 0)
        .mockResolvedValueOnce([
          { quantity: 5, product: { costPrice: 60000, salePrice: 100000 } },
        ]); // ventas del socio

      mockPrisma.user.findMany.mockResolvedValue([{ id: 'p1', name: 'Leo', commissionPct: 20 }]);
      // generada = (100k-60k)*5 * 20% = 40k, pagada = 15k → pendiente = 25k
      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: 15000 } });
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 5 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

      const result = await service.getOwnerDashboard();
      expect(result.data.comisionesPendientes).toBe(25000);
    });

    it('retorna ventasPendientes', async () => {
      mockPrisma.sale.count.mockResolvedValue(7);
      mockPrisma.sale.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

      const result = await service.getOwnerDashboard();
      expect(result.data.ventasPendientes).toBe(7);
    });
  });

  // ── getPartnerDashboard ───────────────────────────────────────────────────────

  describe('getPartnerDashboard', () => {
    const partnerId = 'partner-1';

    it('calcula inventario disponible excluyendo CONFIRMED+PENDING', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ commissionPct: 20, name: 'Leo' });
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'prod-1', name: 'Whisky A' },
      ]);
      // 10 entregados, 4 usados (CONFIRMED+PENDING) → 6 disponibles
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 4 } });
      mockPrisma.sale.findMany.mockResolvedValue([]);
      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      const result = await service.getPartnerDashboard(partnerId);
      expect(result.data.inventario[0].disponible).toBe(6);
    });

    it('filtra inventario con disponible = 0', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ commissionPct: 20, name: 'Leo' });
      mockPrisma.product.findMany.mockResolvedValue([{ id: 'prod-1', name: 'Whisky A' }]);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 5 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 5 } }); // todo agotado
      mockPrisma.sale.findMany.mockResolvedValue([]);
      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      const result = await service.getPartnerDashboard(partnerId);
      expect(result.data.inventario).toHaveLength(0);
    });

    it('calcula comisionPendiente correctamente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ commissionPct: 25, name: 'Leo' });
      mockPrisma.product.findMany.mockResolvedValue([]);
      // ventas confirmadas: ganancia bruta = (80k-50k)*4 = 120k, comisión = 30k
      mockPrisma.sale.findMany.mockResolvedValue([
        { quantity: 4, product: { costPrice: 50000, salePrice: 80000 } },
      ]);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      // pagado: 10k → pendiente = 20k
      mockPrisma.commissionPayment.aggregate.mockResolvedValue({ _sum: { amount: 10000 } });

      const result = await service.getPartnerDashboard(partnerId);
      expect(result.data.comisionGenerada).toBe(30000);
      expect(result.data.comisionPagada).toBe(10000);
      expect(result.data.comisionPendiente).toBe(20000);
    });
  });
});
