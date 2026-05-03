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
        product: { select: { costPrice: true, salePrice: true, businessPrice: true } },
      },
    });
    const totalVentasConfirmadas = ventasConfirmadas.length;

    const precioReal = (sale: any): number =>
      (sale.clientType === 'BUSINESS' && sale.businessPriceSnapshot)
        ? sale.businessPriceSnapshot
        : (sale.salePriceSnapshot ?? sale.product.salePrice);

    const gananciaBruta = ventasConfirmadas.reduce((acc, sale) => {
      const costo = sale.costPriceSnapshot ?? sale.product.costPrice;
      return acc + (precioReal(sale) - costo) * sale.quantity;
    }, 0);

    const ventasPorTipo = {
      consumidor: {
        count: ventasConfirmadas.filter(s => s.clientType !== 'BUSINESS').length,
        ingresos: ventasConfirmadas
          .filter(s => s.clientType !== 'BUSINESS')
          .reduce((acc, s) => acc + precioReal(s) * s.quantity, 0),
      },
      negocio: {
        count: ventasConfirmadas.filter(s => s.clientType === 'BUSINESS').length,
        ingresos: ventasConfirmadas
          .filter(s => s.clientType === 'BUSINESS')
          .reduce((acc, s) => acc + precioReal(s) * s.quantity, 0),
      },
    };

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
        const precio = (sale.clientType === 'BUSINESS' && sale.businessPriceSnapshot)
          ? sale.businessPriceSnapshot
          : (sale.salePriceSnapshot ?? sale.product.salePrice);
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
            const [entregado, vendido, transferOut, transferIn] = await Promise.all([
              this.prisma.delivery.aggregate({
                where: { tenantId, partnerId: partner.id, productId: product.id },
                _sum: { quantity: true },
              }),
              this.prisma.sale.aggregate({
                where: { tenantId, partnerId: partner.id, productId: product.id, status: { in: ['CONFIRMED', 'PENDING'] } },
                _sum: { quantity: true },
              }),
              this.prisma.transfer.aggregate({
                where: { tenantId, fromPartnerId: partner.id, productId: product.id },
                _sum: { quantity: true },
              }),
              this.prisma.transfer.aggregate({
                where: { tenantId, toPartnerId: partner.id, productId: product.id },
                _sum: { quantity: true },
              }),
            ]);
            const disponible =
              (entregado._sum.quantity || 0) -
              (vendido._sum.quantity || 0) -
              (transferOut._sum.quantity || 0) +
              (transferIn._sum.quantity || 0);
            return {
              socio: partner.name,
              producto: product.name,
              entregado: entregado._sum.quantity || 0,
              vendido: vendido._sum.quantity || 0,
              disponible,
            };
          }),
        );

        return items.filter((i) => i.entregado > 0 || i.disponible > 0);
      }),
    );

    return {
      data: {
        ventasPendientes,
        ventasConfirmadas: totalVentasConfirmadas,
        ventasPorTipo: {
          consumidor: { count: ventasPorTipo.consumidor.count, ingresos: Math.round(ventasPorTipo.consumidor.ingresos) },
          negocio: { count: ventasPorTipo.negocio.count, ingresos: Math.round(ventasPorTipo.negocio.ingresos) },
        },
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

    // Inventario disponible por producto (incluye traspasos)
    const inventario = await Promise.all(
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
        return {
          product: { id: product.id, name: product.name },
          disponible:
            (entregado._sum.quantity || 0) -
            (vendido._sum.quantity || 0) -
            (transferOut._sum.quantity || 0) +
            (transferIn._sum.quantity || 0),
        };
      }),
    );

    // Ventas confirmadas (para comisión e ingresos)
    const ventasConfirmadas = await this.prisma.sale.findMany({
      where: { tenantId, partnerId, status: 'CONFIRMED' },
      include: { product: { select: { partnerPrice: true, salePrice: true } } },
    });

    // Últimas 5 ventas (cualquier estado)
    const ultimasVentas = await this.prisma.sale.findMany({
      where: { tenantId, partnerId },
      include: { product: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 5,
    });

    // Conteos
    const ventasPendientesCount = await this.prisma.sale.count({
      where: { tenantId, partnerId, status: 'PENDING' },
    });
    const totalEntregado = await this.prisma.delivery.aggregate({
      where: { tenantId, partnerId },
      _sum: { quantity: true },
    });
    const totalEntregadoQty = totalEntregado._sum.quantity || 0;
    const totalVendidoQty = ventasConfirmadas.reduce((acc, s) => acc + s.quantity, 0);
    const rendimientoPct = totalEntregadoQty > 0
      ? Math.round((totalVendidoQty / totalEntregadoQty) * 100)
      : 0;

    // Ingresos por tipo de cliente
    const ingresoConsumidor = ventasConfirmadas
      .filter(s => s.clientType !== 'BUSINESS')
      .reduce((acc, s) => acc + (s.salePriceSnapshot ?? s.product.salePrice) * s.quantity, 0);
    const ingresoNegocio = ventasConfirmadas
      .filter(s => s.clientType === 'BUSINESS')
      .reduce((acc, s) => {
        const p = (s.businessPriceSnapshot) ? s.businessPriceSnapshot : (s.salePriceSnapshot ?? s.product.salePrice);
        return acc + p * s.quantity;
      }, 0);

    // Comisión
    const comisionGenerada = ventasConfirmadas.reduce((acc, sale) => {
      const precio = (sale.clientType === 'BUSINESS' && sale.businessPriceSnapshot)
        ? sale.businessPriceSnapshot
        : (sale.salePriceSnapshot ?? sale.product.salePrice);
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
        // Comisión
        comisionGenerada: Math.round(comisionGenerada),
        comisionPagada: pagado._sum.amount || 0,
        comisionPendiente: Math.round(comisionPendiente),
        // Actividad
        ventasPendientes: ventasPendientesCount,
        ventasConfirmadas: ventasConfirmadas.length,
        totalUnidadesVendidas: totalVendidoQty,
        rendimientoPct,
        // Ingresos
        totalIngresos: Math.round(ingresoConsumidor + ingresoNegocio),
        ingresoConsumidor: Math.round(ingresoConsumidor),
        ingresoNegocio: Math.round(ingresoNegocio),
        ventasConsumidor: ventasConfirmadas.filter(s => s.clientType !== 'BUSINESS').length,
        ventasNegocio: ventasConfirmadas.filter(s => s.clientType === 'BUSINESS').length,
        // Inventario y últimas ventas
        inventario: inventario.filter((i) => i.disponible > 0),
        ultimasVentas: ultimasVentas.map(v => ({
          id: v.id,
          fecha: v.date,
          producto: v.product.name,
          cantidad: v.quantity,
          clientType: v.clientType,
          status: v.status,
          notes: v.notes,
        })),
      },
      error: null,
      message: null,
    };
  }
}
