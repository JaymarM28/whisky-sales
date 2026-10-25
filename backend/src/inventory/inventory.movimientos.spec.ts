import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

const suma = (n: number) => ({ _sum: { quantity: n } });

describe('InventoryService.getMovimientos', () => {
  it('disponible = entregado − vendido − traspasado + recibido − devuelto', async () => {
    const prisma = {
      delivery: { aggregate: jest.fn().mockResolvedValue(suma(20)) },
      sale: { aggregate: jest.fn().mockResolvedValue(suma(5)) },
      transfer: { aggregate: jest.fn().mockResolvedValueOnce(suma(3)).mockResolvedValueOnce(suma(2)) },
      stockReturn: { aggregate: jest.fn().mockResolvedValue(suma(4)) },
    };
    const service = new InventoryService(prisma as unknown as PrismaService);

    const m = await service.getMovimientos('partner-1', 'prod-1', 't');

    expect(m).toEqual({ entregado: 20, vendido: 5, traspasoSalida: 3, traspasoEntrada: 2, devuelto: 4, disponible: 10 });
  });
});
