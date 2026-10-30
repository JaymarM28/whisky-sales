import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { precioVentaUnitario } from '../common/utils/sale-price';
import { cargosPorSocio } from '../common/utils/loss-charges';

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
      const precioVenta = precioVentaUnitario(sale);

      const precioSocio = sale.partnerPriceSnapshot ?? sale.product.partnerPrice;
      const margenSocio = (precioVenta - precioSocio) * sale.quantity;
      return acc + margenSocio * (partner.commissionPct / 100);
    }, 0);

    const [pagado, perdidas] = await Promise.all([
      this.prisma.commissionPayment.aggregate({ where: { tenantId, partnerId }, _sum: { amount: true } }),
      this.prisma.stockLoss.findMany({ where: { tenantId, partnerId } }),
    ]);

    const pagada = pagado._sum.amount || 0;
    // Parte de las pérdidas (botellas quebradas) que asume el socio
    const cargosPerdidas = cargosPorSocio(perdidas).get(partnerId) ?? 0;
    const pendiente = Math.round(generada - pagada - cargosPerdidas);

    return {
      data: { pendiente, generada: Math.round(generada), pagada, cargosPerdidas },
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
