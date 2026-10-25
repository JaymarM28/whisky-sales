import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService.getRentabilidad', () => {
  it('usa el costo real de compras y el precio de Negocio 2/3', async () => {
    const prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'prod-1', name: 'Whisky A', reference: 'WA', unitsPerBox: null,
            costPrice: 90_000, salePrice: 180_000,
            sales: [
              { quantity: 2, clientType: 'CONSUMER', costPriceSnapshot: 100_000, salePriceSnapshot: 180_000 },
              { quantity: 1, clientType: 'BUSINESS_2', costPriceSnapshot: 100_000, salePriceSnapshot: 180_000, businessPrice2Snapshot: 150_000 },
            ],
          },
        ]),
      },
      // 10 botellas compradas por 1.050.000 → costo real 105.000
      purchase: { groupBy: jest.fn().mockResolvedValue([{ productId: 'prod-1', _sum: { quantity: 10, totalCost: 1_050_000 } }]) },
    };
    const service = new ReportsService(prisma as unknown as PrismaService);

    const { data } = await service.getRentabilidad('t');
    const p = data.productos[0];

    expect(p.costPrice).toBe(105_000);
    expect(p.totalInvertido).toBe(1_050_000);
    expect(p.ingresos).toBe(2 * 180_000 + 150_000);
    // ganancia con el costo de cada venta: (180k−100k)×2 + (150k−100k)×1
    expect(p.gananciaTotal).toBe(210_000);
    expect(p.gananciaPorUnidad).toBe(75_000);
  });
});
