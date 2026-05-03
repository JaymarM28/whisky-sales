import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  cedula: true,
  role: true,
  isAdmin: true,
  commissionPct: true,
  canTransfer: true,
  active: true,
  tenantId: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** OWNER lista sus socios; ADMIN lista todos los owners de todos los tenants */
  async findAll(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, role: 'PARTNER' },
      select: USER_SELECT,
      orderBy: { name: 'asc' },
    });
    return { data: users, error: null, message: null };
  }

  /** Solo para ADMIN: lista todos los usuarios OWNER de la plataforma */
  async findAllOwners() {
    const owners = await this.prisma.user.findMany({
      where: { role: 'OWNER' },
      select: { ...USER_SELECT, tenant: { select: { id: true, name: true, slug: true } } },
      orderBy: { name: 'asc' },
    });
    return { data: owners, error: null, message: null };
  }

  /**
   * OWNER crea un PARTNER en su tenant.
   * ADMIN crea un OWNER asignándolo a un tenant específico (tenantId en el DTO).
   */
  async create(dto: CreateUserDto, requester: { tenantId: string; isAdmin: boolean; role: string }) {
    if (!requester.isAdmin && requester.role !== 'OWNER') {
      throw new ForbiddenException('No tienes permisos para crear usuarios');
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);

    try {
      // Admin puede crear OWNERs con tenantId explícito en el DTO
      if (requester.isAdmin && dto.role === 'OWNER') {
        if (!dto.tenantId) {
          throw new ForbiddenException('Debes indicar el tenantId al crear un OWNER');
        }
        const user = await this.prisma.user.create({
          data: {
            tenantId: dto.tenantId,
            name: dto.name,
            email: dto.email,
            cedula: dto.cedula,
            role: 'OWNER',
            pin: pinHash,
            commissionPct: 0,
          },
          select: USER_SELECT,
        });
        return { data: user, error: null, message: 'Owner creado exitosamente' };
      }

      // OWNER crea un PARTNER en su propio tenant
      const user = await this.prisma.user.create({
        data: {
          tenantId: requester.tenantId,
          name: dto.name,
          email: dto.email,
          cedula: dto.cedula,
          role: 'PARTNER',
          pin: pinHash,
          commissionPct: dto.commissionPct ?? 20,
        },
        select: USER_SELECT,
      });
      return { data: user, error: null, message: 'Socio creado exitosamente' };
    } catch (err: any) {
      const code = err?.code ?? '';
      const msg: string = err?.message ?? '';
      if (code === 'P2002' || msg.includes('Unique constraint')) {
        throw new ConflictException('Ya existe un usuario registrado con esa cédula');
      }
      if (code === 'P2003' || msg.includes('Foreign key constraint')) {
        throw new NotFoundException('El negocio seleccionado no existe');
      }
      throw err;
    }
  }

  async updateMyPin(id: string, pin: string) {
    const pinHash = await bcrypt.hash(pin, 10);
    const user = await this.prisma.user.update({
      where: { id },
      data: { pin: pinHash },
      select: USER_SELECT,
    });
    return { data: user, error: null, message: 'PIN actualizado correctamente' };
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Socio no encontrado');

    const data: any = { ...dto };
    if (dto.pin) {
      data.pin = await bcrypt.hash(dto.pin, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
    return { data: user, error: null, message: 'Socio actualizado exitosamente' };
  }

  async deactivate(id: string, tenantId: string) {
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Socio no encontrado');

    const user = await this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, name: true, active: true },
    });
    return { data: user, error: null, message: 'Socio desactivado exitosamente' };
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Socio no encontrado');

    const [entregas, ventas, traspasosOut, traspasosIn, comisiones] = await Promise.all([
      this.prisma.delivery.count({ where: { partnerId: id } }),
      this.prisma.sale.count({ where: { partnerId: id } }),
      this.prisma.transfer.count({ where: { fromPartnerId: id } }),
      this.prisma.transfer.count({ where: { toPartnerId: id } }),
      this.prisma.commissionPayment.count({ where: { partnerId: id } }),
    ]);

    const total = entregas + ventas + traspasosOut + traspasosIn + comisiones;
    if (total > 0) {
      const detalle = [
        entregas   > 0 ? `${entregas} entrega(s)`   : null,
        ventas     > 0 ? `${ventas} venta(s)`       : null,
        traspasosOut + traspasosIn > 0 ? `${traspasosOut + traspasosIn} traspaso(s)` : null,
        comisiones > 0 ? `${comisiones} pago(s) de comisión` : null,
      ].filter(Boolean).join(', ');
      throw new BadRequestException(
        `No se puede eliminar: el socio tiene ${detalle} registrados`,
      );
    }

    await this.prisma.user.delete({ where: { id } });
    return { data: null, error: null, message: 'Socio eliminado correctamente' };
  }
}
