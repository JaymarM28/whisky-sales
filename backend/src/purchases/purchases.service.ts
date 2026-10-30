import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { ListFilterDto, rangoFechas } from '../common/dto/list-filter.dto';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filtros: ListFilterDto = {}) {
    const { productId, desde, hasta, page = 1, limit = 20 } = filtros;
    const skip = (page - 1) * limit;
    const where = { tenantId, ...(productId && { productId }), ...rangoFechas(desde, hasta) };
    const include = { product: { select: { id: true, name: true, reference: true, unitsPerBox: true } } };
    const [data, total, suma] = await Promise.all([
      this.prisma.purchase.findMany({ where, include, orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.purchase.count({ where }),
      this.prisma.purchase.aggregate({ where, _sum: { quantity: true, totalCost: true } }),
    ]);
    // Totales del filtro completo (no solo de la página)
    const resumen = { unidades: suma._sum.quantity || 0, totalPagado: suma._sum.totalCost || 0 };
    return { data, total, page, limit, totalPages: Math.ceil(total / limit), resumen, error: null, message: null };
  }

  async create(dto: CreatePurchaseDto, tenantId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const purchase = await this.prisma.purchase.create({
      data: {
        tenantId,
        productId: dto.productId,
        quantity: dto.quantity,
        totalCost: dto.totalCost,
        unitCost: Math.round(dto.totalCost / dto.quantity),
        supplier: dto.supplier,
        date: new Date(dto.date),
        notes: dto.notes,
      },
      include: { product: { select: { id: true, name: true, reference: true, unitsPerBox: true } } },
    });

    await this.recalcularCostoPromedio(dto.productId, tenantId);

    return { data: purchase, error: null, message: 'Compra registrada exitosamente' };
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.purchase.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Compra no encontrada');

    const bodega = await this.getStockBodega(existing.productId, tenantId);
    if (bodega < existing.quantity) {
      throw new BadRequestException(
        `No se puede eliminar: ya se entregaron unidades de esta compra (en bodega: ${bodega}, compra: ${existing.quantity})`,
      );
    }

    await this.prisma.purchase.delete({ where: { id } });
    await this.recalcularCostoPromedio(existing.productId, tenantId);

    return { data: null, error: null, message: 'Compra eliminada exitosamente' };
  }

  /** Unidades en bodega del dueño = comprado − entregado a socios + devuelto por socios − perdido en bodega. */
  async getStockBodega(productId: string, tenantId: string): Promise<number> {
    const [comprado, entregado, devuelto, perdido] = await Promise.all([
      this.prisma.purchase.aggregate({ where: { tenantId, productId }, _sum: { quantity: true } }),
      this.prisma.delivery.aggregate({ where: { tenantId, productId }, _sum: { quantity: true } }),
      this.prisma.stockReturn.aggregate({ where: { tenantId, productId }, _sum: { quantity: true } }),
      this.prisma.stockLoss.aggregate({ where: { tenantId, productId, partnerId: null }, _sum: { quantity: true } }),
    ]);
    return (
      (comprado._sum.quantity || 0) -
      (entregado._sum.quantity || 0) +
      (devuelto._sum.quantity || 0) -
      (perdido._sum.quantity || 0)
    );
  }

  async getStock(tenantId: string) {
    const [products, compras, entregas, devoluciones, perdidas] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId, active: true },
        select: { id: true, name: true, reference: true, unitsPerBox: true, costPrice: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.purchase.groupBy({
        by: ['productId'],
        where: { tenantId },
        _sum: { quantity: true, totalCost: true },
      }),
      this.prisma.delivery.groupBy({
        by: ['productId'],
        where: { tenantId },
        _sum: { quantity: true },
      }),
      this.prisma.stockReturn.groupBy({
        by: ['productId'],
        where: { tenantId },
        _sum: { quantity: true },
      }),
      this.prisma.stockLoss.groupBy({
        by: ['productId'],
        where: { tenantId, partnerId: null },
        _sum: { quantity: true },
      }),
    ]);

    const data = products.map((product) => {
      const c = compras.find((x) => x.productId === product.id);
      const e = entregas.find((x) => x.productId === product.id);
      const d = devoluciones.find((x) => x.productId === product.id);
      const pe = perdidas.find((x) => x.productId === product.id);
      const totalComprado = c?._sum.quantity || 0;
      const totalEntregado = e?._sum.quantity || 0;
      const totalDevuelto = d?._sum.quantity || 0;
      const totalPerdido = pe?._sum.quantity || 0;
      return {
        product,
        totalComprado,
        totalInvertido: c?._sum.totalCost || 0,
        totalEntregado,
        totalDevuelto,
        totalPerdido,
        enBodega: totalComprado - totalEntregado + totalDevuelto - totalPerdido,
      };
    });

    const totales = {
      totalComprado: data.reduce((acc, d) => acc + d.totalComprado, 0),
      totalInvertido: data.reduce((acc, d) => acc + d.totalInvertido, 0),
      totalEntregado: data.reduce((acc, d) => acc + d.totalEntregado, 0),
      totalDevuelto: data.reduce((acc, d) => acc + d.totalDevuelto, 0),
      totalPerdido: data.reduce((acc, d) => acc + d.totalPerdido, 0),
      enBodega: data.reduce((acc, d) => acc + d.enBodega, 0),
    };

    return { data: { productos: data, totales }, error: null, message: null };
  }

  /**
   * Actualiza el costPrice del producto al promedio ponderado de todas sus compras.
   * El dueño puede sobrescribirlo manualmente; la próxima compra lo recalcula.
   */
  private async recalcularCostoPromedio(productId: string, tenantId: string) {
    const agg = await this.prisma.purchase.aggregate({
      where: { tenantId, productId },
      _sum: { quantity: true, totalCost: true },
    });
    const unidades = agg._sum.quantity || 0;
    if (unidades === 0) return;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { unitsPerBox: true },
    });
    const costPrice = Math.round((agg._sum.totalCost || 0) / unidades);

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        costPrice,
        // Mantiene boxCost coherente para que editar el producto no recalcule con un valor viejo
        ...(product?.unitsPerBox && { boxCost: costPrice * product.unitsPerBox }),
      },
    });
  }
}
