import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { InventoryService } from '../inventory/inventory.service';
import { rangoFechas } from '../common/dto/list-filter.dto';
import { SaleFilterDto } from './dto/sale-filter.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';

/** Quita de una venta los datos de costo del negocio, que el socio no debe ver. */
function ocultarCostos<T extends { costPriceSnapshot?: number | null; product?: object }>(sale: T) {
  const { costPriceSnapshot: _, ...resto } = sale;
  if (resto.product && 'costPrice' in resto.product) {
    const { costPrice: __, ...product } = resto.product as { costPrice?: number };
    return { ...resto, product };
  }
  return resto;
}

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private inventory: InventoryService,
  ) {}

  async findAll(userId: string, role: string, tenantId: string, filtros: SaleFilterDto = {}) {
    const { partnerId, productId, status, desde, hasta, page = 1, limit = 20 } = filtros;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      // El socio siempre ve solo las suyas; el dueño puede filtrar por socio
      ...(role === 'PARTNER' ? { partnerId: userId } : partnerId && { partnerId }),
      ...(productId && { productId }),
      ...(status && { status }),
      ...rangoFechas(desde, hasta),
    };
    const include = {
      partner: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, reference: true, salePrice: true, costPrice: true } },
    };
    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.sale.count({ where }),
    ]);
    const visibles = role === 'PARTNER' ? data.map(ocultarCostos) : data;
    return { data: visibles, total, page, limit, totalPages: Math.ceil(total / limit), error: null, message: null };
  }

  async create(dto: CreateSaleDto, partnerId: string, tenantId: string, receiptImage?: string) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const disponible = await this.inventory.getDisponible(partnerId, dto.productId, tenantId);

    if (dto.quantity > disponible) {
      throw new BadRequestException(
        `Cantidad solicitada (${dto.quantity}) supera el inventario disponible (${disponible})`,
      );
    }

    const clientType = dto.clientType ?? 'CONSUMER';

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
        clientType,
        costPriceSnapshot: product.costPrice,
        salePriceSnapshot: product.salePrice,
        partnerPriceSnapshot: product.partnerPrice,
        businessPriceSnapshot: product.businessPrice,
        businessPrice2Snapshot: product.businessPrice2,
        businessPrice3Snapshot: product.businessPrice3,
      },
      include: {
        partner: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, reference: true } },
      },
    });

    const owner = await this.prisma.user.findFirst({
      where: { tenantId, role: 'OWNER' },
      select: { email: true },
    });
    if (owner?.email) {
      void this.mail.notifyOwnerNewSale({
        ownerEmail: owner.email,
        partnerName: sale.partner.name,
        productName: sale.product.name,
        quantity: sale.quantity,
        date: new Date(sale.date).toLocaleDateString('es-CO'),
        notes: sale.notes ?? undefined,
      });
    }

    return { data: ocultarCostos(sale), error: null, message: 'Venta reportada exitosamente' };
  }

  async updateStatus(id: string, dto: UpdateSaleStatusDto, tenantId: string) {
    const existing = await this.prisma.sale.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Venta no encontrada');

    // PENDING → CONFIRMED | REJECTED; CONFIRMED → REJECTED (anular). Una rechazada no se reabre.
    const permitidas: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'REJECTED'],
      CONFIRMED: ['REJECTED'],
      REJECTED: [],
    };
    if (!permitidas[existing.status].includes(dto.status)) {
      throw new BadRequestException(`No se puede cambiar una venta ${existing.status} a ${dto.status}`);
    }

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
    if (existing.status === 'CONFIRMED') {
      throw new BadRequestException('No se puede eliminar una venta confirmada: afecta comisiones ya calculadas. Anúlala en su lugar.');
    }

    await this.prisma.sale.delete({ where: { id } });
    return { data: null, error: null, message: 'Venta eliminada exitosamente' };
  }
}
