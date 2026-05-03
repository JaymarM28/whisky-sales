import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getAll(tenantId: string) {
    const partners = await this.prisma.user.findMany({
      where: { tenantId, role: 'PARTNER', active: true },
      select: { id: true, name: true },
    });

    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, reference: true, salePrice: true, businessPrice: true },
    });

    const result = await Promise.all(
      partners.map(async (partner) => {
        const items = await Promise.all(
          products.map(async (product) => {
            const entregado = await this.prisma.delivery.aggregate({
              where: { tenantId, partnerId: partner.id, productId: product.id },
              _sum: { quantity: true },
            });

            const vendido = await this.prisma.sale.aggregate({
              where: { tenantId, partnerId: partner.id, productId: product.id, status: { in: ['CONFIRMED', 'PENDING'] } },
              _sum: { quantity: true },
            });

            const disponible =
              (entregado._sum.quantity || 0) - (vendido._sum.quantity || 0);

            return {
              product,
              totalDelivered: entregado._sum.quantity || 0,
              totalSold: vendido._sum.quantity || 0,
              available: disponible,
            };
          }),
        );

        return { partner, inventory: items.filter((i) => i.totalDelivered > 0) };
      }),
    );

    return { data: result, error: null, message: null };
  }

  async getByPartner(partnerId: string, tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, reference: true, salePrice: true, businessPrice: true },
    });

    const items = await Promise.all(
      products.map(async (product) => {
        const [entregado, vendido, transferOut, transferIn] = await Promise.all([
          this.prisma.delivery.aggregate({
            where: { tenantId, partnerId, productId: product.id },
            _sum: { quantity: true },
          }),
          this.prisma.sale.aggregate({
            where: { tenantId, partnerId, productId: product.id, status: { in: ['CONFIRMED', 'PENDING'] } },
            _sum: { quantity: true },
          }),
          this.prisma.transfer.aggregate({
            where: { tenantId, fromPartnerId: partnerId, productId: product.id },
            _sum: { quantity: true },
          }),
          this.prisma.transfer.aggregate({
            where: { tenantId, toPartnerId: partnerId, productId: product.id },
            _sum: { quantity: true },
          }),
        ]);

        const disponible =
          (entregado._sum.quantity || 0) -
          (vendido._sum.quantity || 0) -
          (transferOut._sum.quantity || 0) +
          (transferIn._sum.quantity || 0);

        return {
          product,
          totalDelivered: entregado._sum.quantity || 0,
          totalSold: vendido._sum.quantity || 0,
          available: disponible,
        };
      }),
    );

    return {
      data: items.filter((i) => i.totalDelivered > 0 || i.available > 0),
      error: null,
      message: null,
    };
  }
}
