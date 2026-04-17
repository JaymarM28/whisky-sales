import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommissionDto } from './dto/create-commission.dto';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: string, tenantId: string) {
    const where = role === 'PARTNER' ? { partnerId: userId, tenantId } : { tenantId };
    const payments = await this.prisma.commissionPayment.findMany({
      where,
      include: {
        partner: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
    return { data: payments, error: null, message: null };
  }

  async create(dto: CreateCommissionDto, tenantId: string) {
    const partner = await this.prisma.user.findFirst({ where: { id: dto.partnerId, tenantId } });
    if (!partner) throw new NotFoundException('Socio no encontrado');

    const payment = await this.prisma.commissionPayment.create({
      data: {
        tenantId,
        partnerId: dto.partnerId,
        amount: dto.amount,
        paymentReference: dto.paymentReference,
        date: new Date(dto.date),
      },
      include: {
        partner: { select: { id: true, name: true } },
      },
    });

    return { data: payment, error: null, message: 'Pago de comisión registrado exitosamente' };
  }

  async getPendingForPartner(partnerId: string, tenantId: string) {
    const partner = await this.prisma.user.findFirst({
      where: { id: partnerId, tenantId },
      select: { commissionPct: true },
    });
    if (!partner) throw new NotFoundException('Socio no encontrado');

    const ventas = await this.prisma.sale.findMany({
      where: { tenantId, partnerId, status: 'CONFIRMED' },
      include: { product: { select: { partnerPrice: true, salePrice: true } } },
    });

    const generada = ventas.reduce((acc, sale) => {
      const margenSocio = (sale.product.salePrice - sale.product.partnerPrice) * sale.quantity;
      return acc + margenSocio * (partner.commissionPct / 100);
    }, 0);

    const pagado = await this.prisma.commissionPayment.aggregate({
      where: { tenantId, partnerId },
      _sum: { amount: true },
    });

    const pagada = pagado._sum.amount || 0;
    const pendiente = Math.round(generada - pagada);

    return {
      data: { pendiente, generada: Math.round(generada), pagada },
      error: null,
      message: null,
    };
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.commissionPayment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Pago no encontrado');

    await this.prisma.commissionPayment.delete({ where: { id } });
    return { data: null, error: null, message: 'Pago eliminado exitosamente' };
  }
}
