import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { InventoryService } from '../inventory/inventory.service';

const venta = {
  id: 'sale-1',
  quantity: 2,
  costPriceSnapshot: 100_000,
  salePriceSnapshot: 180_000,
  product: { id: 'prod-1', name: 'Whisky A', reference: 'WA', salePrice: 180_000, costPrice: 100_000 },
};

const mockPrisma = {
  sale: { findMany: jest.fn(), count: jest.fn() },
};

describe('SalesService — visibilidad de costos', () => {
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
    mockPrisma.sale.findMany.mockResolvedValue([venta]);
    mockPrisma.sale.count.mockResolvedValue(1);
  });

  it('el socio no recibe el costo del negocio', async () => {
    const result = await service.findAll('partner-1', 'PARTNER', 'tenant-1');
    const sale = result.data[0] as any;

    expect(sale.costPriceSnapshot).toBeUndefined();
    expect(sale.product.costPrice).toBeUndefined();
    expect(sale.salePriceSnapshot).toBe(180_000);
    expect(sale.product.salePrice).toBe(180_000);
  });

  it('el dueño sí recibe el costo', async () => {
    const result = await service.findAll('owner-1', 'OWNER', 'tenant-1');
    const sale = result.data[0] as any;

    expect(sale.costPriceSnapshot).toBe(100_000);
    expect(sale.product.costPrice).toBe(100_000);
  });
});
