import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchasesService } from '../purchases/purchases.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ListFilterDto, rangoFechas } from '../common/dto/list-filter.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private purchases: PurchasesService,
    private inventory: InventoryService,
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

    const bodega = await this.purchases.getStockBodega(dto.productId, tenantId);
    if (dto.quantity > bodega) {
      throw new BadRequestException(
        `Stock insuficiente en bodega. Disponible: ${bodega}. Registra una compra antes de entregar.`,
      );
    }

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

    const disponible = await this.inventory.getDisponible(existing.partnerId, existing.productId, tenantId);
    if (disponible < existing.quantity) {
      throw new BadRequestException(
        `No se puede eliminar: el socio ya vendió o traspasó parte de esta entrega (le quedan ${disponible} de ${existing.quantity}).`,
      );
    }

    await this.prisma.delivery.delete({ where: { id } });
    return { data: null, error: null, message: 'Entrega eliminada exitosamente' };
  }
}
