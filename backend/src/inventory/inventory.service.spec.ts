import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: { findMany: jest.fn() },
  product: { findMany: jest.fn() },
  delivery: { aggregate: jest.fn() },
  sale: { aggregate: jest.fn() },
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  // ── getByPartner ─────────────────────────────────────────────────────────────

  describe('getByPartner', () => {
    const partnerId = 'partner-1';
    const products = [
      { id: 'prod-1', name: 'Whisky A', reference: 'WA-001' },
      { id: 'prod-2', name: 'Whisky B', reference: 'WB-001' },
    ];

    it('calcula disponible = entregado - (CONFIRMED + PENDING)', async () => {
      mockPrisma.product.findMany.mockResolvedValue([products[0]]);
      // 12 entregados, 5 vendidos (CONFIRMED+PENDING)
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 12 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 5 } });

      const result = await service.getByPartner(partnerId);
      expect(result.data[0].available).toBe(7);
    });

    it('disponible es 0 cuando todo está vendido o reservado', async () => {
      mockPrisma.product.findMany.mockResolvedValue([products[0]]);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });

      const result = await service.getByPartner(partnerId);
      // Filtra items con totalDelivered > 0, available puede ser 0
      expect(result.data[0].available).toBe(0);
    });

    it('filtra productos sin entregas (totalDelivered = 0)', async () => {
      mockPrisma.product.findMany.mockResolvedValue(products);
      // prod-1: 5 entregados | prod-2: 0 entregados
      mockPrisma.delivery.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 5 } })
        .mockResolvedValueOnce({ _sum: { quantity: 0 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

      const result = await service.getByPartner(partnerId);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].product.id).toBe('prod-1');
    });

    it('maneja _sum.quantity null (sin entregas ni ventas)', async () => {
      mockPrisma.product.findMany.mockResolvedValue([products[0]]);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: null } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: null } });

      const result = await service.getByPartner(partnerId);
      // totalDelivered = 0, filtrado
      expect(result.data).toHaveLength(0);
    });

    it('retorna totalDelivered y totalSold correctamente', async () => {
      mockPrisma.product.findMany.mockResolvedValue([products[0]]);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 20 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 8 } });

      const result = await service.getByPartner(partnerId);
      expect(result.data[0].totalDelivered).toBe(20);
      expect(result.data[0].totalSold).toBe(8);
      expect(result.data[0].available).toBe(12);
    });
  });

  // ── getAll ───────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('retorna inventario agrupado por socio', async () => {
      const partners = [{ id: 'p1', name: 'Leo' }];
      const products = [{ id: 'prod-1', name: 'Whisky A', reference: 'WA' }];

      mockPrisma.user.findMany.mockResolvedValue(partners);
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 6 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 2 } });

      const result = await service.getAll();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].partner.name).toBe('Leo');
      expect(result.data[0].inventory[0].available).toBe(4);
    });
  });
});
