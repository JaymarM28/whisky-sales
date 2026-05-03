import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, partnerId?: string, productId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { tenantId, ...(partnerId && { partnerId }), ...(productId && { productId }) };
    const include = {
      partner: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, reference: true } },
    };
    const [data, total] = await Promise.all([
      this.prisma.delivery.findMany({ where, include, orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.delivery.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit), error: null, message: null };
  }

  async create(dto: CreateDeliveryDto, tenantId: string) {
    const partner = await this.prisma.user.findFirst({ where: { id: dto.partnerId, tenantId } });
    if (!partner) throw new NotFoundException('Socio no encontrado');

    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const delivery = await this.prisma.delivery.create({
      data: {
        tenantId,
        partnerId: dto.partnerId,
        productId: dto.productId,
        quantity: dto.quantity,
        date: new Date(dto.date),
        notes: dto.notes,
      },
      include: {
        partner: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, reference: true } },
      },
    });
    return { data: delivery, error: null, message: 'Entrega registrada exitosamente' };
  }

  async remove(id: string, tenantId: string) {
    const result = await this.prisma.delivery.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new NotFoundException('Entrega no encontrada');
    return { data: null, error: null, message: 'Entrega eliminada exitosamente' };
  }
}
