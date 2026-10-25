import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  product: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  purchase: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn(), aggregate: jest.fn() },
  delivery: { aggregate: jest.fn() },
  stockReturn: { aggregate: jest.fn() },
};

describe('PurchasesService', () => {
  let service: PurchasesService;
  const tenantId = 'tenant-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchasesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    jest.clearAllMocks();
    mockPrisma.stockReturn.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { productId: 'prod-1', quantity: 12, totalCost: 1_200_000, date: '2026-10-01' };

    it('lanza NotFoundException si el producto no es del tenant', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);
      await expect(service.create(dto, tenantId)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.purchase.create).not.toHaveBeenCalled();
    });

    it('calcula unitCost = totalCost / quantity', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.purchase.create.mockResolvedValue({ id: 'p-1' });
      mockPrisma.purchase.aggregate.mockResolvedValue({ _sum: { quantity: 12, totalCost: 1_200_000 } });
      mockPrisma.product.findUnique.mockResolvedValue({ unitsPerBox: null });

      await service.create(dto, tenantId);

      expect(mockPrisma.purchase.create.mock.calls[0][0].data.unitCost).toBe(100_000);
    });

    it('actualiza costPrice al promedio ponderado de todas las compras', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.purchase.create.mockResolvedValue({ id: 'p-2' });
      // compra previa: 12 × 100.000 | nueva: 12 × 110.000 → promedio 105.000
      mockPrisma.purchase.aggregate.mockResolvedValue({ _sum: { quantity: 24, totalCost: 2_520_000 } });
      mockPrisma.product.findUnique.mockResolvedValue({ unitsPerBox: 12 });

      await service.create({ ...dto, totalCost: 1_320_000 }, tenantId);

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { costPrice: 105_000, boxCost: 1_260_000 },
      });
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('bloquea si las unidades de la compra ya fueron entregadas', async () => {
      mockPrisma.purchase.findFirst.mockResolvedValue({ id: 'p-1', productId: 'prod-1', quantity: 10 });
      mockPrisma.purchase.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 4 } });

      await expect(service.remove('p-1', tenantId)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.purchase.delete).not.toHaveBeenCalled();
    });

    it('elimina si toda la compra sigue en bodega', async () => {
      mockPrisma.purchase.findFirst.mockResolvedValue({ id: 'p-1', productId: 'prod-1', quantity: 10 });
      mockPrisma.purchase.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 10 } }) // stock bodega
        .mockResolvedValueOnce({ _sum: { quantity: 0, totalCost: 0 } }); // recálculo
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

      await service.remove('p-1', tenantId);

      expect(mockPrisma.purchase.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });

  // ── getStockBodega ───────────────────────────────────────────────────────────

  it('getStockBodega = comprado − entregado + devuelto', async () => {
    mockPrisma.purchase.aggregate.mockResolvedValue({ _sum: { quantity: 30 } });
    mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 18 } });
    mockPrisma.stockReturn.aggregate.mockResolvedValue({ _sum: { quantity: 4 } });
    await expect(service.getStockBodega('prod-1', tenantId)).resolves.toBe(16);
  });
});
