import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { precioVentaUnitario, esVentaNegocio } from '../common/utils/sale-price';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  private getPrecioVenta(sale: any): number {
    return precioVentaUnitario(sale);
  }

  private esNegocio(sale: any): boolean {
    return esVentaNegocio(sale);
  }

  async getOwnerDashboard(tenantId: string) {
    const [ventasPendientes, ventasConfirmadas, partners, products, pagos, compras, entregado, devuelto, movimientos] =
      await Promise.all([
        this.prisma.sale.count({ where: { tenantId, status: 'PENDING' } }),
        this.prisma.sale.findMany({
          where: { tenantId, status: 'CONFIRMED' },
          include: { product: { select: { costPrice: true, salePrice: true, partnerPrice: true } } },
        }),
        this.prisma.user.findMany({
          where: { tenantId, role: 'PARTNER', active: true },
          select: { id: true, name: true, commissionPct: true },
        }),
        this.prisma.product.findMany({ where: { tenantId, active: true }, select: { id: true, name: true } }),
        this.prisma.commissionPayment.groupBy({ by: ['partnerId'], where: { tenantId }, _sum: { amount: true } }),
        this.prisma.purchase.aggregate({ where: { tenantId }, _sum: { quantity: true, totalCost: true } }),
        this.prisma.delivery.aggregate({ where: { tenantId }, _sum: { quantity: true } }),
        this.prisma.stockReturn.aggregate({ where: { tenantId }, _sum: { quantity: true } }),
        this.inventory.getMovimientosNegocio(tenantId),
      ]);

    const gananciaBruta = ventasConfirmadas.reduce((acc, sale) => {
      const costo = sale.costPriceSnapshot ?? sale.product.costPrice;
      return acc + (this.getPrecioVenta(sale) - costo) * sale.quantity;
    }, 0);

    const consumidor = ventasConfirmadas.filter((s) => !this.esNegocio(s));
    const negocio = ventasConfirmadas.filter((s) => this.esNegocio(s));
    const ingresos = (ventas: typeof ventasConfirmadas) =>
      ventas.reduce((acc, s) => acc + this.getPrecioVenta(s) * s.quantity, 0);

    // Comisiones de socios activos: generada por sus ventas confirmadas, pagada según sus pagos
    let comisionesTotalGeneradas = 0;
    let comisionesTotalPagadas = 0;
    for (const partner of partners) {
      comisionesTotalGeneradas += ventasConfirmadas
        .filter((sale) => sale.partnerId === partner.id)
        .reduce((acc, sale) => {
          const precioSocio = sale.partnerPriceSnapshot ?? sale.product.partnerPrice;
          const margenSocio = (this.getPrecioVenta(sale) - precioSocio) * sale.quantity;
          return acc + margenSocio * (partner.commissionPct / 100);
        }, 0);
      comisionesTotalPagadas += pagos.find((p) => p.partnerId === partner.id)?._sum.amount || 0;
    }

    const comisionesPendientes = comisionesTotalGeneradas - comisionesTotalPagadas;
    const gananciaNeta = gananciaBruta - comisionesTotalPagadas;

    const totalEntregado = entregado._sum.quantity || 0;
    const totalVendido = ventasConfirmadas.reduce((acc, s) => acc + s.quantity, 0);
    const totalDevuelto = devuelto._sum.quantity || 0;
    const totalComprado = compras._sum.quantity || 0;

    // Inventario por socio (para la tabla)
    const inventarioPorSocio = partners.flatMap((partner) =>
      products
        .map((product) => {
          const m = this.inventory.movimientosDe(movimientos, partner.id, product.id);
          return {
            socio: partner.name,
            producto: product.name,
            entregado: m.entregado,
            vendido: m.vendido,
            disponible: m.disponible,
          };
        })
        .filter((i) => i.entregado > 0 || i.disponible > 0),
    );

    return {
      data: {
        ventasPendientes,
        ventasConfirmadas: ventasConfirmadas.length,
        ventasPorTipo: {
          consumidor: { count: consumidor.length, ingresos: Math.round(ingresos(consumidor)) },
          negocio: { count: negocio.length, ingresos: Math.round(ingresos(negocio)) },
        },
        gananciaBruta: Math.round(gananciaBruta),
        gananciaNeta: Math.round(gananciaNeta),
        comisionesGeneradas: Math.round(comisionesTotalGeneradas),
        comisionesPagadas: Math.round(comisionesTotalPagadas),
        comisionesPendientes: Math.round(comisionesPendientes),
        inventarioGlobal: {
          totalComprado,
          totalInvertido: compras._sum.totalCost || 0,
          enBodega: totalComprado - totalEntregado + totalDevuelto,
          totalEntregado,
          totalVendido,
          totalDevuelto,
          disponible: totalEntregado - totalVendido - totalDevuelto,
        },
        inventarioPorSocio,
      },
      error: null,
      message: null,
    };
  }

  async getPartnerDashboard(partnerId: string, tenantId: string) {
    const [partner, products, movimientos, ventasConfirmadas, ultimasVentas, ventasPendientesCount, totalEntregado, devueltoSocio] =
      await Promise.all([
        this.prisma.user.findFirst({ where: { id: partnerId, tenantId }, select: { commissionPct: true, name: true } }),
        this.prisma.product.findMany({ where: { tenantId, active: true }, select: { id: true, name: true } }),
        this.inventory.getMovimientosNegocio(tenantId, partnerId),
        // Ventas confirmadas (para comisión)
        this.prisma.sale.findMany({
          where: { tenantId, partnerId, status: 'CONFIRMED' },
          include: { product: { select: { partnerPrice: true, salePrice: true } } },
        }),
        // Últimas 5 ventas (cualquier estado)
        this.prisma.sale.findMany({
          where: { tenantId, partnerId },
          include: { product: { select: { name: true } } },
          orderBy: { date: 'desc' },
          take: 5,
        }),
        this.prisma.sale.count({ where: { tenantId, partnerId, status: 'PENDING' } }),
        this.prisma.delivery.aggregate({ where: { tenantId, partnerId }, _sum: { quantity: true } }),
        this.prisma.stockReturn.aggregate({ where: { tenantId, partnerId }, _sum: { quantity: true } }),
      ]);

    // Inventario disponible por producto (incluye traspasos y devoluciones)
    const inventario = products.map((product) => ({
      product: { id: product.id, name: product.name },
      disponible: this.inventory.movimientosDe(movimientos, partnerId, product.id).disponible,
    }));

    // Lo devuelto a bodega no cuenta como entregado para el rendimiento
    const totalEntregadoQty = (totalEntregado._sum.quantity || 0) - (devueltoSocio._sum.quantity || 0);
    const totalVendidoQty = ventasConfirmadas.reduce((acc, s) => acc + s.quantity, 0);
    const rendimientoPct = totalEntregadoQty > 0
      ? Math.round((totalVendidoQty / totalEntregadoQty) * 100)
      : 0;

    // Comisión (lo que gana el socio). No se exponen ingresos del negocio al socio.
    const comisionDe = (sale: (typeof ventasConfirmadas)[number]) => {
      const precioSocio = sale.partnerPriceSnapshot ?? sale.product.partnerPrice;
      const margenSocio = (this.getPrecioVenta(sale) - precioSocio) * sale.quantity;
      return margenSocio * (partner!.commissionPct / 100);
    };
    const comisionConsumidor = ventasConfirmadas
      .filter(s => !this.esNegocio(s))
      .reduce((acc, s) => acc + comisionDe(s), 0);
    const comisionNegocio = ventasConfirmadas
      .filter(s => this.esNegocio(s))
      .reduce((acc, s) => acc + comisionDe(s), 0);
    const comisionGenerada = comisionConsumidor + comisionNegocio;

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
        // Ganancias del socio por tipo de cliente
        comisionConsumidor: Math.round(comisionConsumidor),
        comisionNegocio: Math.round(comisionNegocio),
        ventasConsumidor: ventasConfirmadas.filter(s => !this.esNegocio(s)).length,
        ventasNegocio: ventasConfirmadas.filter(s => this.esNegocio(s)).length,
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
