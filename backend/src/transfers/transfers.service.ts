import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private inventory: InventoryService,
  ) {}

  async findAll(
    userId: string,
    role: string,
    tenantId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where =
      role === 'PARTNER'
        ? { tenantId, OR: [{ fromPartnerId: userId }, { toPartnerId: userId }] }
        : { tenantId };

    const include = {
      fromPartner: { select: { id: true, name: true } },
      toPartner: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, reference: true } },
    };

    const [data, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        include,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      error: null,
      message: null,
    };
  }

  async getRecipients(requesterId: string, tenantId: string) {
    const partners = await this.prisma.user.findMany({
      where: { tenantId, role: 'PARTNER', active: true, id: { not: requesterId } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { data: partners, error: null, message: null };
  }

  async create(
    dto: CreateTransferDto,
    requesterId: string,
    requesterRole: string,
    tenantId: string,
  ) {
    const fromPartnerId = requesterRole === 'OWNER' ? dto.fromPartnerId : requesterId;

    if (!fromPartnerId) {
      throw new BadRequestException('fromPartnerId es requerido');
    }

    if (fromPartnerId === dto.toPartnerId) {
      throw new BadRequestException('El socio remitente y receptor no pueden ser el mismo');
    }

    const fromPartner = await this.prisma.user.findFirst({
      where: { id: fromPartnerId, tenantId },
    });
    if (!fromPartner) throw new NotFoundException('Socio remitente no encontrado');

    if (requesterRole !== 'OWNER' && !fromPartner.canTransfer) {
      throw new ForbiddenException('No tienes permiso para realizar traspasos');
    }

    const toPartner = await this.prisma.user.findFirst({
      where: { id: dto.toPartnerId, tenantId, role: 'PARTNER', active: true },
    });
    if (!toPartner) throw new NotFoundException('Socio receptor no encontrado');

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const available = await this.inventory.getDisponible(fromPartnerId, dto.productId, tenantId);

    if (available < dto.quantity) {
      throw new BadRequestException(
        `Inventario insuficiente. Disponible: ${available}`,
      );
    }

    const transfer = await this.prisma.transfer.create({
      data: {
        tenantId,
        fromPartnerId,
        toPartnerId: dto.toPartnerId,
        productId: dto.productId,
        quantity: dto.quantity,
        date: new Date(dto.date),
        notes: dto.notes,
      },
      include: {
        fromPartner: { select: { id: true, name: true } },
        toPartner: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, reference: true } },
      },
    });

    const owner = await this.prisma.user.findFirst({
      where: { tenantId, role: 'OWNER', active: true, email: { not: null } },
      select: { email: true },
    });

    if (owner?.email) {
      const dateFormatted = new Date(dto.date).toLocaleDateString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
      this.mail.notifyOwnerNewTransfer({
        ownerEmail: owner.email,
        fromPartnerName: transfer.fromPartner.name,
        toPartnerName: transfer.toPartner.name,
        productName: transfer.product.name,
        quantity: transfer.quantity,
        date: dateFormatted,
        notes: transfer.notes ?? undefined,
      });
    }

    return { data: transfer, error: null, message: 'Traspaso registrado exitosamente' };
  }

  async remove(id: string, tenantId: string, role: string) {
    if (role !== 'OWNER') {
      throw new ForbiddenException('Solo el owner puede eliminar traspasos');
    }
    const existing = await this.prisma.transfer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Traspaso no encontrado');

    const disponible = await this.inventory.getDisponible(existing.toPartnerId, existing.productId, tenantId);
    if (disponible < existing.quantity) {
      throw new BadRequestException(
        `No se puede eliminar: el socio receptor ya vendió o traspasó parte de estas unidades (le quedan ${disponible} de ${existing.quantity}).`,
      );
    }

    await this.prisma.transfer.delete({ where: { id } });
    return { data: null, error: null, message: 'Traspaso eliminado exitosamente' };
  }
}
