import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { InventoryService } from '../inventory/inventory.service';

const mockPrisma = {
  sale: { findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

describe('SalesService — estados y eliminación', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: {} },
        { provide: InventoryService, useValue: {} },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
    mockPrisma.sale.update.mockResolvedValue({ id: 'sale-1' });
  });

  it.each([
    ['PENDING', 'CONFIRMED'],
    ['PENDING', 'REJECTED'],
    ['CONFIRMED', 'REJECTED'],
  ])('permite %s → %s', async (actual, nuevo) => {
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'sale-1', status: actual });
    await service.updateStatus('sale-1', { status: nuevo as any }, 't');
    expect(mockPrisma.sale.update).toHaveBeenCalled();
  });

  it.each([
    ['REJECTED', 'CONFIRMED'],
    ['CONFIRMED', 'CONFIRMED'],
    ['REJECTED', 'REJECTED'],
  ])('bloquea %s → %s', async (actual, nuevo) => {
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'sale-1', status: actual });
    await expect(service.updateStatus('sale-1', { status: nuevo as any }, 't')).rejects.toThrow(BadRequestException);
    expect(mockPrisma.sale.update).not.toHaveBeenCalled();
  });

  it('no permite eliminar una venta confirmada', async () => {
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'sale-1', status: 'CONFIRMED' });
    await expect(service.remove('sale-1', 't')).rejects.toThrow(BadRequestException);
    expect(mockPrisma.sale.delete).not.toHaveBeenCalled();
  });

  it('permite eliminar una venta pendiente o rechazada', async () => {
    mockPrisma.sale.findFirst.mockResolvedValue({ id: 'sale-1', status: 'REJECTED' });
    await service.remove('sale-1', 't');
    expect(mockPrisma.sale.delete).toHaveBeenCalledWith({ where: { id: 'sale-1' } });
  });
});
