import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateCommissionDto } from './dto/create-commission.dto';

@Injectable()
export class CommissionsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async findAll(userId: string, role: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = role === 'PARTNER' ? { partnerId: userId, tenantId } : { tenantId };
    const include = { partner: { select: { id: true, name: true } } };
    const [data, total] = await Promise.all([
      this.prisma.commissionPayment.findMany({ where, include, orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.commissionPayment.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit), error: null, message: null };
  }

  async create(dto: CreateCommissionDto, tenantId: string) {
    const partner = await this.prisma.user.findFirst({
      where: { id: dto.partnerId, tenantId },
      select: { name: true, email: true },
    });
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

    if (partner.email) {
      void this.mail.notifyPartnerCommission({
        partnerEmail: partner.email,
        partnerName: partner.name,
        amount: payment.amount,
        reference: payment.paymentReference ?? undefined,
        date: new Date(payment.date).toLocaleDateString('es-CO'),
      });
    }

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
      let precioVenta: number;
      if (sale.clientType === 'BUSINESS' && sale.businessPriceSnapshot)
        precioVenta = sale.businessPriceSnapshot;
      else if (sale.clientType === 'BUSINESS_2' && sale.businessPrice2Snapshot)
        precioVenta = sale.businessPrice2Snapshot;
      else if (sale.clientType === 'BUSINESS_3' && sale.businessPrice3Snapshot)
        precioVenta = sale.businessPrice3Snapshot;
      else
        precioVenta = sale.salePriceSnapshot ?? sale.product.salePrice;

      const precioSocio = sale.partnerPriceSnapshot ?? sale.product.partnerPrice;
      const margenSocio = (precioVenta - precioSocio) * sale.quantity;
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
    const result = await this.prisma.commissionPayment.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new NotFoundException('Pago no encontrado');
    return { data: null, error: null, message: 'Pago eliminado exitosamente' };
  }
}
