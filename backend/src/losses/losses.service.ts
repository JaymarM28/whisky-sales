import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { PurchasesService } from '../purchases/purchases.service';
import { CreateLossDto } from './dto/create-loss.dto';
import { ListFilterDto, rangoFechas } from '../common/dto/list-filter.dto';
import { valorPerdida, cargoAlSocio } from '../common/utils/loss-charges';

@Injectable()
export class LossesService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
    private purchases: PurchasesService,
  ) {}

  async findAll(tenantId: string, filtros: ListFilterDto = {}) {
    const { partnerId, productId, desde, hasta, page = 1, limit = 20 } = filtros;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      ...(partnerId && { partnerId }),
      ...(productId && { productId }),
      ...rangoFechas(desde, hasta),
    };
    const include = {
      partner: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, reference: true } },
    };
    const [rows, total, todas] = await Promise.all([
      this.prisma.stockLoss.findMany({ where, include, orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.stockLoss.count({ where }),
      this.prisma.stockLoss.findMany({ where }),
    ]);

    const data = rows.map((p) => ({ ...p, valor: valorPerdida(p), cargoSocio: cargoAlSocio(p) }));
    // Totales del filtro completo (no solo de la página)
    const valor = todas.reduce((acc, p) => acc + valorPerdida(p), 0);
    const asumidoSocios = todas.reduce((acc, p) => acc + cargoAlSocio(p), 0);
    const resumen = {
      unidades: todas.reduce((acc, p) => acc + p.quantity, 0),
      valor,
      asumidoSocios,
      asumidoNegocio: valor - asumidoSocios,
    };
    return { data, total, page, limit, totalPages: Math.ceil(total / limit), resumen, error: null, message: null };
  }

  async create(dto: CreateLossDto, tenantId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (dto.partnerId) {
      const partner = await this.prisma.user.findFirst({ where: { id: dto.partnerId, tenantId, role: 'PARTNER' } });
      if (!partner) throw new NotFoundException('Socio no encontrado');

      const disponible = await this.inventory.getDisponible(dto.partnerId, dto.productId, tenantId);
      if (dto.quantity > disponible) {
        throw new BadRequestException(`El socio solo tiene ${disponible} unidad(es) de este producto`);
      }
    } else {
      if (dto.partnerSharePct) {
        throw new BadRequestException('Una pérdida en bodega la asume el negocio: no puede tener porcentaje del socio');
      }
      const bodega = await this.purchases.getStockBodega(dto.productId, tenantId);
      if (dto.quantity > bodega) {
        throw new BadRequestException(`En bodega solo hay ${bodega} unidad(es) de este producto`);
      }
    }

    const perdida = await this.prisma.stockLoss.create({
      data: {
        tenantId,
        productId: dto.productId,
        partnerId: dto.partnerId || null,
        quantity: dto.quantity,
        unitCost: product.costPrice,
        partnerSharePct: dto.partnerId ? dto.partnerSharePct ?? 0 : 0,
        date: new Date(dto.date),
        notes: dto.notes,
      },
      include: {
        partner: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, reference: true } },
      },
    });
    return {
      data: { ...perdida, valor: valorPerdida(perdida), cargoSocio: cargoAlSocio(perdida) },
      error: null,
      message: 'Pérdida registrada',
    };
  }

  /** Eliminar una pérdida devuelve las unidades al inventario y anula el cargo al socio. */
  async remove(id: string, tenantId: string) {
    const result = await this.prisma.stockLoss.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new NotFoundException('Pérdida no encontrada');
    return { data: null, error: null, message: 'Pérdida eliminada' };
  }
}
