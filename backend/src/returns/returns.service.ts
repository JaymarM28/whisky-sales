import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { PurchasesService } from '../purchases/purchases.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { ListFilterDto, rangoFechas } from '../common/dto/list-filter.dto';

@Injectable()
export class ReturnsService {
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
    const [data, total] = await Promise.all([
      this.prisma.stockReturn.findMany({ where, include, orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.stockReturn.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit), error: null, message: null };
  }

  async create(dto: CreateReturnDto, tenantId: string) {
    const partner = await this.prisma.user.findFirst({ where: { id: dto.partnerId, tenantId, role: 'PARTNER' } });
    if (!partner) throw new NotFoundException('Socio no encontrado');

    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const disponible = await this.inventory.getDisponible(dto.partnerId, dto.productId, tenantId);
    if (dto.quantity > disponible) {
      throw new BadRequestException(`El socio solo tiene ${disponible} unidad(es) de este producto para devolver`);
    }

    const devolucion = await this.prisma.stockReturn.create({
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
    return { data: devolucion, error: null, message: 'Devolución registrada exitosamente' };
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.stockReturn.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Devolución no encontrada');

    // Las unidades devueltas pudieron entregarse de nuevo desde bodega
    const bodega = await this.purchases.getStockBodega(existing.productId, tenantId);
    if (bodega < existing.quantity) {
      throw new BadRequestException(
        `No se puede eliminar: esas unidades ya salieron de bodega (en bodega: ${bodega}, devolución: ${existing.quantity}).`,
      );
    }

    await this.prisma.stockReturn.delete({ where: { id } });
    return { data: null, error: null, message: 'Devolución eliminada exitosamente' };
  }
}
