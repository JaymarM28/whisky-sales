import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, partnerId?: string, productId?: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        tenantId,
        ...(partnerId && { partnerId }),
        ...(productId && { productId }),
      },
      include: {
        partner: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, reference: true } },
      },
      orderBy: { date: 'desc' },
    });
    return { data: deliveries, error: null, message: null };
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
    const existing = await this.prisma.delivery.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Entrega no encontrada');

    await this.prisma.delivery.delete({ where: { id } });
    return { data: null, error: null, message: 'Entrega eliminada exitosamente' };
  }
}
