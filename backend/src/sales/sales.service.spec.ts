import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  product: { findUnique: jest.fn() },
  delivery: { aggregate: jest.fn() },
  sale: { aggregate: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const partnerId = 'partner-1';
    const dto = { productId: 'prod-1', quantity: 5, date: '2026-04-01', notes: '' };
    const product = { id: 'prod-1', name: 'Whisky A', salePrice: 100000, costPrice: 60000 };

    it('lanza NotFoundException si el producto no existe', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.create(dto, partnerId)).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si la cantidad supera el inventario disponible', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(product);
      // 10 entregados, 8 usados (CONFIRMED+PENDING) → 2 disponibles
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 8 } });

      await expect(service.create({ ...dto, quantity: 5 }, partnerId)).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException con mensaje descriptivo indicando el disponible real', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 8 } });

      await expect(service.create({ ...dto, quantity: 5 }, partnerId)).rejects.toThrow(/disponible \(2\)/);
    });

    it('crea la venta con status PENDING cuando hay suficiente inventario', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 12 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 4 } });

      const createdSale = { id: 'sale-1', ...dto, status: 'PENDING', partnerId, partner: {}, product: {} };
      mockPrisma.sale.create.mockResolvedValue(createdSale);

      const result = await service.create(dto, partnerId);

      expect(mockPrisma.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PENDING', partnerId, quantity: 5 }),
        }),
      );
      expect(result.data.status).toBe('PENDING');
    });

    it('considera ventas PENDING al calcular inventario disponible (reserva)', async () => {
      // 12 entregados, 10 usados (ej: 7 CONFIRMED + 3 PENDING) → 2 disponibles
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 12 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });

      await expect(service.create({ ...dto, quantity: 3 }, partnerId)).rejects.toThrow(BadRequestException);
    });

    it('crea venta sin imagen de comprobante (opcional)', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.delivery.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { quantity: 2 } });

      const createdSale = { id: 'sale-1', ...dto, status: 'PENDING', partnerId, receiptImage: null, partner: {}, product: {} };
      mockPrisma.sale.create.mockResolvedValue(createdSale);

      const result = await service.create(dto, partnerId, undefined);
      expect(result.error).toBeNull();
    });
  });

  // ── updateStatus ─────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('lanza NotFoundException si la venta no existe', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('no-existe', { status: 'CONFIRMED' })).rejects.toThrow(NotFoundException);
    });

    it('actualiza el estado a CONFIRMED', async () => {
      const existingSale = { id: 'sale-1', status: 'PENDING' };
      const updatedSale = { ...existingSale, status: 'CONFIRMED', partner: {}, product: {} };

      mockPrisma.sale.findUnique.mockResolvedValue(existingSale);
      mockPrisma.sale.update.mockResolvedValue(updatedSale);

      const result = await service.updateStatus('sale-1', { status: 'CONFIRMED' });
      expect(result.data.status).toBe('CONFIRMED');
    });

    it('actualiza el estado a REJECTED (libera inventario implícitamente)', async () => {
      const existingSale = { id: 'sale-1', status: 'PENDING' };
      const updatedSale = { ...existingSale, status: 'REJECTED', partner: {}, product: {} };

      mockPrisma.sale.findUnique.mockResolvedValue(existingSale);
      mockPrisma.sale.update.mockResolvedValue(updatedSale);

      const result = await service.updateStatus('sale-1', { status: 'REJECTED' });
      expect(result.data.status).toBe('REJECTED');
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('lanza NotFoundException si la venta no existe', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null);
      await expect(service.remove('no-existe')).rejects.toThrow(NotFoundException);
    });

    it('elimina la venta correctamente', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({ id: 'sale-1' });
      mockPrisma.sale.delete.mockResolvedValue({});

      const result = await service.remove('sale-1');
      expect(mockPrisma.sale.delete).toHaveBeenCalledWith({ where: { id: 'sale-1' } });
      expect(result.error).toBeNull();
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('PARTNER solo ve sus propias ventas', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([]);
      await service.findAll('partner-1', 'PARTNER');
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { partnerId: 'partner-1' } }),
      );
    });

    it('OWNER ve todas las ventas', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([]);
      await service.findAll('owner-1', 'OWNER');
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });
});
