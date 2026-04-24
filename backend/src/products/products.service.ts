import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ProductFields = {
  name?: string;
  reference?: string;
  unitsPerBox?: number | null;
  boxCost?: number | null;
  costPrice?: number;
  partnerPrice?: number;
  salePrice?: number;
  active?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit), error: null, message: null };
  }

  async create(dto: CreateProductDto, tenantId: string) {
    const existing = await this.prisma.product.findFirst({
      where: { tenantId, reference: dto.reference },
    });
    if (existing) {
      throw new ConflictException('Ya existe un producto con esa referencia');
    }

    const data = this.resolveData(dto);
    const product = await this.prisma.product.create({
      data: { ...data, tenantId } as any,
    });
    return { data: product, error: null, message: 'Producto creado exitosamente' };
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string) {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Producto no encontrado');

    if (dto.reference && dto.reference !== existing.reference) {
      const conflict = await this.prisma.product.findFirst({
        where: { tenantId, reference: dto.reference },
      });
      if (conflict) throw new ConflictException('Ya existe un producto con esa referencia');
    }

    const data = this.resolveData(dto);
    const product = await this.prisma.product.update({ where: { id }, data: data as any });
    return { data: product, error: null, message: 'Producto actualizado exitosamente' };
  }

  private resolveData(dto: CreateProductDto | UpdateProductDto): ProductFields {
    const d: ProductFields = { ...dto };
    if (d.boxCost && d.unitsPerBox && d.unitsPerBox > 0) {
      d.costPrice = Math.round(d.boxCost / d.unitsPerBox);
    }
    return d;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Producto no encontrado');

    const tieneRegistros =
      (await this.prisma.delivery.count({ where: { productId: id } })) > 0 ||
      (await this.prisma.sale.count({ where: { productId: id } })) > 0;

    if (tieneRegistros) {
      const product = await this.prisma.product.update({
        where: { id },
        data: { active: false },
      });
      return { data: { ...product, eliminado: false }, error: null, message: 'Producto desactivado (tiene registros asociados)' };
    }

    await this.prisma.product.delete({ where: { id } });
    return { data: { id, eliminado: true }, error: null, message: 'Producto eliminado exitosamente' };
  }
}
