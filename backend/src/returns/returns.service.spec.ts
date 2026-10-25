import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { PurchasesService } from '../purchases/purchases.service';

const mockPrisma = {
  user: { findFirst: jest.fn() },
  product: { findFirst: jest.fn() },
  stockReturn: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
};
const mockInventory = { getDisponible: jest.fn() };
const mockPurchases = { getStockBodega: jest.fn() };

describe('ReturnsService', () => {
  let service: ReturnsService;
  const dto = { partnerId: 'partner-1', productId: 'prod-1', quantity: 3, date: '2026-10-24' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InventoryService, useValue: mockInventory },
        { provide: PurchasesService, useValue: mockPurchases },
      ],
    }).compile();

    service = module.get<ReturnsService>(ReturnsService);
    jest.clearAllMocks();
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'partner-1' });
    mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1' });
  });

  describe('create', () => {
    it('lanza NotFoundException si el socio no es del tenant', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.create(dto, 't')).rejects.toThrow(NotFoundException);
    });

    it('no permite devolver más de lo que tiene el socio', async () => {
      mockInventory.getDisponible.mockResolvedValue(2);
      await expect(service.create(dto, 't')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.stockReturn.create).not.toHaveBeenCalled();
    });

    it('registra la devolución si el socio tiene suficiente', async () => {
      mockInventory.getDisponible.mockResolvedValue(3);
      mockPrisma.stockReturn.create.mockResolvedValue({ id: 'r-1' });
      const result = await service.create(dto, 't');
      expect(result.data).toEqual({ id: 'r-1' });
    });
  });

  describe('remove', () => {
    const devolucion = { id: 'r-1', productId: 'prod-1', quantity: 3 };

    it('bloquea si esas unidades ya salieron de bodega', async () => {
      mockPrisma.stockReturn.findFirst.mockResolvedValue(devolucion);
      mockPurchases.getStockBodega.mockResolvedValue(1);
      await expect(service.remove('r-1', 't')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.stockReturn.delete).not.toHaveBeenCalled();
    });

    it('elimina si las unidades siguen en bodega', async () => {
      mockPrisma.stockReturn.findFirst.mockResolvedValue(devolucion);
      mockPurchases.getStockBodega.mockResolvedValue(5);
      await service.remove('r-1', 't');
      expect(mockPrisma.stockReturn.delete).toHaveBeenCalledWith({ where: { id: 'r-1' } });
    });
  });
});
