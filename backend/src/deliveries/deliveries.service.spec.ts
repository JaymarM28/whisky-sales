import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { PrismaService } from '../prisma/prisma.service';
import { PurchasesService } from '../purchases/purchases.service';
import { InventoryService } from '../inventory/inventory.service';

const mockPrisma = {
  user: { findFirst: jest.fn() },
  product: { findFirst: jest.fn() },
  delivery: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
};
const mockPurchases = { getStockBodega: jest.fn() };
const mockInventory = { getDisponible: jest.fn() };

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  const dto = { partnerId: 'partner-1', productId: 'prod-1', quantity: 6, date: '2026-10-01' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PurchasesService, useValue: mockPurchases },
        { provide: InventoryService, useValue: mockInventory },
      ],
    }).compile();

    service = module.get<DeliveriesService>(DeliveriesService);
    jest.clearAllMocks();
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'partner-1' });
    mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1' });
  });

  it('bloquea la entrega si supera el stock en bodega', async () => {
    mockPurchases.getStockBodega.mockResolvedValue(5);
    await expect(service.create(dto, 'tenant-1')).rejects.toThrow(BadRequestException);
    expect(mockPrisma.delivery.create).not.toHaveBeenCalled();
  });

  it('permite entregar exactamente lo que hay en bodega', async () => {
    mockPurchases.getStockBodega.mockResolvedValue(6);
    mockPrisma.delivery.create.mockResolvedValue({ id: 'd-1' });
    const result = await service.create(dto, 'tenant-1');
    expect(result.data).toEqual({ id: 'd-1' });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    const entrega = { id: 'd-1', partnerId: 'partner-1', productId: 'prod-1', quantity: 6 };

    it('bloquea si el socio ya vendió o traspasó parte de la entrega', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(entrega);
      mockInventory.getDisponible.mockResolvedValue(4);

      await expect(service.remove('d-1', 'tenant-1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.delivery.delete).not.toHaveBeenCalled();
    });

    it('elimina si el socio aún tiene todas las unidades', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(entrega);
      mockInventory.getDisponible.mockResolvedValue(6);

      await service.remove('d-1', 'tenant-1');
      expect(mockPrisma.delivery.delete).toHaveBeenCalledWith({ where: { id: 'd-1' } });
    });
  });
});
