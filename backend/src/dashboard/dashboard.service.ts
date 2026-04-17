import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOwnerDashboard(tenantId: string) {
    const ventasPendientes = await this.prisma.sale.count({
      where: { tenantId, status: 'PENDING' },
    });

    const ventasConfirmadas = await this.prisma.sale.findMany({
      where: { tenantId, status: 'CONFIRMED' },
      include: {
        product: { select: { costPrice: true, salePrice: true } },
      },
    });
    const totalVentasConfirmadas = ventasConfirmadas.length;

    const gananciaBruta = ventasConfirmadas.reduce((acc, sale) => {
      const costo = sale.costPriceSnapshot ?? sale.product.costPrice;
      const precio = sale.salePriceSnapshot ?? sale.product.salePrice;
      return acc + (precio - costo) * sale.quantity;
    }, 0);

    const partners = await this.prisma.user.findMany({
      where: { tenantId, role: 'PARTNER', active: true },
      select: { id: true, name: true, commissionPct: true },
    });

    let comisionesTotalGeneradas = 0;
    let comisionesTotalPagadas = 0;

    for (const partner of partners) {
      const ventas = await this.prisma.sale.findMany({
        where: { tenantId, partnerId: partner.id, status: 'CONFIRMED' },
        include: { product: { select: { partnerPrice: true, salePrice: true } } },
      });

      const generada = ventas.reduce((acc, sale) => {
        const precio = sale.salePriceSnapshot ?? sale.product.salePrice;
        const precioSocio = sale.partnerPriceSnapshot ?? sale.product.partnerPrice;
        const margenSocio = (precio - precioSocio) * sale.quantity;
        return acc + margenSocio * (partner.commissionPct / 100);
      }, 0);

      const pagada = await this.prisma.commissionPayment.aggregate({
        where: { tenantId, partnerId: partner.id },
        _sum: { amount: true },
      });

      comisionesTotalGeneradas += generada;
      comisionesTotalPagadas += pagada._sum.amount || 0;
    }

    const comisionesPendientes = comisionesTotalGeneradas - comisionesTotalPagadas;
    const gananciaNeta = gananciaBruta - comisionesTotalPagadas;

    const inventarioGlobal = await this.prisma.delivery.aggregate({
      where: { tenantId },
      _sum: { quantity: true },
    });

    const inventarioVendido = await this.prisma.sale.aggregate({
      where: { tenantId, status: 'CONFIRMED' },
      _sum: { quantity: true },
    });

    // Inventario por socio (para la tabla)
    const inventarioPorSocio = await Promise.all(
      partners.map(async (partner) => {
        const products = await this.prisma.product.findMany({
          where: { tenantId, active: true },
          select: { id: true, name: true },
        });

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
            return {
              socio: partner.name,
              producto: product.name,
              entregado: entregado._sum.quantity || 0,
              vendido: vendido._sum.quantity || 0,
              disponible: (entregado._sum.quantity || 0) - (vendido._sum.quantity || 0),
            };
          }),
        );

        return items.filter((i) => i.entregado > 0);
      }),
    );

    return {
      data: {
        ventasPendientes,
        ventasConfirmadas: totalVentasConfirmadas,
        gananciaBruta: Math.round(gananciaBruta),
        gananciaNeta: Math.round(gananciaNeta),
        comisionesGeneradas: Math.round(comisionesTotalGeneradas),
        comisionesPagadas: Math.round(comisionesTotalPagadas),
        comisionesPendientes: Math.round(comisionesPendientes),
        inventarioGlobal: {
          totalEntregado: inventarioGlobal._sum.quantity || 0,
          totalVendido: inventarioVendido._sum.quantity || 0,
          disponible:
            (inventarioGlobal._sum.quantity || 0) - (inventarioVendido._sum.quantity || 0),
        },
        inventarioPorSocio: inventarioPorSocio.flat(),
      },
      error: null,
      message: null,
    };
  }

  async getPartnerDashboard(partnerId: string, tenantId: string) {
    const partner = await this.prisma.user.findFirst({
      where: { id: partnerId, tenantId },
      select: { commissionPct: true, name: true },
    });

    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
    });

    const inventario = await Promise.all(
      products.map(async (product) => {
        const entregado = await this.prisma.delivery.aggregate({
          where: { tenantId, partnerId, productId: product.id },
          _sum: { quantity: true },
        });

        const vendido = await this.prisma.sale.aggregate({
          where: { tenantId, partnerId, productId: product.id, status: { in: ['CONFIRMED', 'PENDING'] } },
          _sum: { quantity: true },
        });

        return {
          product: { id: product.id, name: product.name },
          disponible: (entregado._sum.quantity || 0) - (vendido._sum.quantity || 0),
        };
      }),
    );

    const ventas = await this.prisma.sale.findMany({
      where: { tenantId, partnerId, status: 'CONFIRMED' },
      include: { product: { select: { partnerPrice: true, salePrice: true } } },
    });

    const comisionGenerada = ventas.reduce((acc, sale) => {
      const precio = sale.salePriceSnapshot ?? sale.product.salePrice;
      const precioSocio = sale.partnerPriceSnapshot ?? sale.product.partnerPrice;
      const margenSocio = (precio - precioSocio) * sale.quantity;
      return acc + margenSocio * (partner.commissionPct / 100);
    }, 0);

    const pagado = await this.prisma.commissionPayment.aggregate({
      where: { tenantId, partnerId },
      _sum: { amount: true },
    });

    const comisionPendiente = comisionGenerada - (pagado._sum.amount || 0);

    return {
      data: {
        inventario: inventario.filter((i) => i.disponible > 0),
        comisionGenerada: Math.round(comisionGenerada),
        comisionPagada: pagado._sum.amount || 0,
        comisionPendiente: Math.round(comisionPendiente),
      },
      error: null,
      message: null,
    };
  }
}
