import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = role === 'PARTNER' ? { partnerId: userId, tenantId } : { tenantId };
    const include = {
      partner: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, reference: true, salePrice: true, costPrice: true } },
    };
    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({ where, include, orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.sale.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit), error: null, message: null };
  }

  async create(dto: CreateSaleDto, partnerId: string, tenantId: string, receiptImage?: string) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const entregado = await this.prisma.delivery.aggregate({
      where: { partnerId, productId: dto.productId, tenantId },
      _sum: { quantity: true },
    });

    const vendido = await this.prisma.sale.aggregate({
      where: { partnerId, productId: dto.productId, tenantId, status: { in: ['CONFIRMED', 'PENDING'] } },
      _sum: { quantity: true },
    });

    const disponible = (entregado._sum.quantity || 0) - (vendido._sum.quantity || 0);

    if (dto.quantity > disponible) {
      throw new BadRequestException(
        `Cantidad solicitada (${dto.quantity}) supera el inventario disponible (${disponible})`,
      );
    }

    const sale = await this.prisma.sale.create({
      data: {
        tenantId,
        partnerId,
        productId: dto.productId,
        quantity: dto.quantity,
        date: new Date(dto.date),
        notes: dto.notes,
        receiptImage,
        status: 'PENDING',
        costPriceSnapshot: product.costPrice,
        salePriceSnapshot: product.salePrice,
        partnerPriceSnapshot: product.partnerPrice,
      },
      include: {
        partner: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, reference: true } },
      },
    });

    return { data: sale, error: null, message: 'Venta reportada exitosamente' };
  }

  async updateStatus(id: string, dto: UpdateSaleStatusDto, tenantId: string) {
    const existing = await this.prisma.sale.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Venta no encontrada');

    const sale = await this.prisma.sale.update({
      where: { id },
      data: { status: dto.status },
      include: {
        partner: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, reference: true } },
      },
    });

    return { data: sale, error: null, message: 'Estado de venta actualizado' };
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.sale.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Venta no encontrada');

    await this.prisma.sale.delete({ where: { id } });
    return { data: null, error: null, message: 'Venta eliminada exitosamente' };
  }
}
