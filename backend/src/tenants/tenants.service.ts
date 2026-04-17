import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Ya existe un negocio con ese código');
    }

    const tenant = await this.prisma.tenant.create({ data: dto });
    return { data: tenant, error: null, message: 'Negocio creado exitosamente' };
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.active) {
      throw new NotFoundException('Negocio no encontrado');
    }
    return { data: { id: tenant.id, name: tenant.name, slug: tenant.slug }, error: null, message: null };
  }

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({ orderBy: { name: 'asc' } });
    return { data: tenants, error: null, message: null };
  }
}
