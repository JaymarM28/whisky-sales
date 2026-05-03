import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getRentabilidad(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      include: {
        sales: {
          where: { status: 'CONFIRMED' },
          select: { quantity: true, costPriceSnapshot: true, salePriceSnapshot: true, clientType: true, businessPriceSnapshot: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = products.map((p) => {
      const totalVendido = p.sales.reduce((acc, s) => acc + s.quantity, 0);
      const gananciaPorUnidad = p.salePrice - p.costPrice;
      const gananciaTotal = p.sales.reduce((acc, s) => {
        const costo = s.costPriceSnapshot ?? p.costPrice;
        const precio = (s.clientType === 'BUSINESS' && s.businessPriceSnapshot)
          ? s.businessPriceSnapshot
          : (s.salePriceSnapshot ?? p.salePrice);
        return acc + (precio - costo) * s.quantity;
      }, 0);
      const margenPct = p.costPrice > 0 ? (gananciaPorUnidad / p.costPrice) * 100 : 0;
      const inversionTotal = p.boxCost && p.unitsPerBox
        ? Math.ceil(totalVendido / p.unitsPerBox) * p.boxCost
        : totalVendido * p.costPrice;

      return {
        id: p.id,
        nombre: p.name,
        referencia: p.reference,
        unitsPerBox: p.unitsPerBox,
        boxCost: p.boxCost,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        totalVendido,
        gananciaPorUnidad,
        gananciaTotal,
        margenPct: Math.round(margenPct * 10) / 10,
        inversionTotal,
      };
    });

    const totales = {
      gananciaTotal: data.reduce((acc, d) => acc + d.gananciaTotal, 0),
      totalUnidades: data.reduce((acc, d) => acc + d.totalVendido, 0),
    };

    return { data: { productos: data, totales }, error: null, message: null };
  }

  async getVentas(tenantId: string, desde?: string, hasta?: string) {
    const where: any = { tenantId, status: 'CONFIRMED' };
    if (desde || hasta) {
      where.date = {};
      if (desde) where.date.gte = new Date(desde);
      if (hasta) where.date.lte = new Date(hasta + 'T23:59:59');
    }

    const ventas = await this.prisma.sale.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, costPrice: true, salePrice: true } },
        partner: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const precioVenta = (v: any): number =>
      (v.clientType === 'BUSINESS' && v.businessPriceSnapshot)
        ? v.businessPriceSnapshot
        : (v.salePriceSnapshot ?? v.product.salePrice);
    const precioCosto = (v: any): number => v.costPriceSnapshot ?? v.product.costPrice;

    // Por producto
    const porProductoMap = new Map<string, any>();
    for (const v of ventas) {
      const key = v.product.id;
      if (!porProductoMap.has(key)) {
        porProductoMap.set(key, { nombre: v.product.name, totalUnidades: 0, totalIngresos: 0, totalGanancia: 0 });
      }
      const entry = porProductoMap.get(key);
      entry.totalUnidades += v.quantity;
      entry.totalIngresos += v.quantity * precioVenta(v);
      entry.totalGanancia += v.quantity * (precioVenta(v) - precioCosto(v));
    }

    // Por socio
    const porSocioMap = new Map<string, any>();
    for (const v of ventas) {
      const key = v.partner.id;
      if (!porSocioMap.has(key)) {
        porSocioMap.set(key, { nombre: v.partner.name, totalUnidades: 0, totalIngresos: 0 });
      }
      const entry = porSocioMap.get(key);
      entry.totalUnidades += v.quantity;
      entry.totalIngresos += v.quantity * precioVenta(v);
    }

    // Por mes
    const porMesMap = new Map<string, any>();
    for (const v of ventas) {
      const key = v.date.toISOString().slice(0, 7);
      if (!porMesMap.has(key)) {
        porMesMap.set(key, { mes: key, totalUnidades: 0, totalIngresos: 0, totalGanancia: 0 });
      }
      const entry = porMesMap.get(key);
      entry.totalUnidades += v.quantity;
      entry.totalIngresos += v.quantity * precioVenta(v);
      entry.totalGanancia += v.quantity * (precioVenta(v) - precioCosto(v));
    }

    // Por tipo de cliente
    const porTipoCliente = [
      { tipo: 'CONSUMER', label: 'Consumidor final', totalVentas: 0, totalUnidades: 0, totalIngresos: 0, totalGanancia: 0 },
      { tipo: 'BUSINESS', label: 'Negocio / Mayorista', totalVentas: 0, totalUnidades: 0, totalIngresos: 0, totalGanancia: 0 },
    ];
    for (const v of ventas) {
      const idx = (v.clientType === 'BUSINESS') ? 1 : 0;
      porTipoCliente[idx].totalVentas += 1;
      porTipoCliente[idx].totalUnidades += v.quantity;
      porTipoCliente[idx].totalIngresos += v.quantity * precioVenta(v);
      porTipoCliente[idx].totalGanancia += v.quantity * (precioVenta(v) - precioCosto(v));
    }

    return {
      data: {
        totalVentas: ventas.length,
        totalUnidades: ventas.reduce((acc, v) => acc + v.quantity, 0),
        totalIngresos: ventas.reduce((acc, v) => acc + v.quantity * precioVenta(v), 0),
        totalGanancia: ventas.reduce((acc, v) => acc + v.quantity * (precioVenta(v) - precioCosto(v)), 0),
        porProducto: Array.from(porProductoMap.values()).sort((a, b) => b.totalUnidades - a.totalUnidades),
        porSocio: Array.from(porSocioMap.values()).sort((a, b) => b.totalUnidades - a.totalUnidades),
        porMes: Array.from(porMesMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([, v]) => v),
        porTipoCliente,
      },
      error: null,
      message: null,
    };
  }

  async getSocios(tenantId: string) {
    const partners = await this.prisma.user.findMany({
      where: { tenantId, role: 'PARTNER' },
      orderBy: { name: 'asc' },
    });

    const data = await Promise.all(
      partners.map(async (partner) => {
        const entregado = await this.prisma.delivery.aggregate({
          where: { tenantId, partnerId: partner.id },
          _sum: { quantity: true },
        });

        const vendidoConf = await this.prisma.sale.aggregate({
          where: { tenantId, partnerId: partner.id, status: 'CONFIRMED' },
          _sum: { quantity: true },
        });

        const vendidoPend = await this.prisma.sale.aggregate({
          where: { tenantId, partnerId: partner.id, status: 'PENDING' },
          _sum: { quantity: true },
        });

        const ventasConf = await this.prisma.sale.findMany({
          where: { tenantId, partnerId: partner.id, status: 'CONFIRMED' },
          include: { product: { select: { partnerPrice: true, salePrice: true } } },
        });

        const comisionGenerada = ventasConf.reduce((acc, sale) => {
          const precio = (sale.clientType === 'BUSINESS' && sale.businessPriceSnapshot)
            ? sale.businessPriceSnapshot
            : (sale.salePriceSnapshot ?? sale.product.salePrice);
          const precioSocio = sale.partnerPriceSnapshot ?? sale.product.partnerPrice;
          const margen = (precio - precioSocio) * sale.quantity;
          return acc + margen * (partner.commissionPct / 100);
        }, 0);

        const pagado = await this.prisma.commissionPayment.aggregate({
          where: { tenantId, partnerId: partner.id },
          _sum: { amount: true },
        });

        const totalEntregado = entregado._sum.quantity || 0;
        const totalVendido = vendidoConf._sum.quantity || 0;
        const totalPendiente = vendidoPend._sum.quantity || 0;
        const disponible = totalEntregado - totalVendido - totalPendiente;
        const rendimientoPct = totalEntregado > 0 ? (totalVendido / totalEntregado) * 100 : 0;

        return {
          id: partner.id,
          nombre: partner.name,
          activo: partner.active,
          commissionPct: partner.commissionPct,
          totalEntregado,
          totalVendido,
          totalPendiente,
          disponible,
          rendimientoPct: Math.round(rendimientoPct * 10) / 10,
          comisionGenerada: Math.round(comisionGenerada),
          comisionPagada: pagado._sum.amount || 0,
          comisionPendiente: Math.round(comisionGenerada) - (pagado._sum.amount || 0),
        };
      }),
    );

    return { data, error: null, message: null };
  }

  async getInventarioPorSocio(tenantId: string) {
    const partners = await this.prisma.user.findMany({
      where: { tenantId, role: 'PARTNER' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, active: true },
    });

    const products = await this.prisma.product.findMany({
      where: { tenantId },
      select: { id: true, name: true, reference: true },
    });

    const data = await Promise.all(
      partners.map(async (partner) => {
        const productosConActividad = await Promise.all(
          products.map(async (product) => {
            const [entregas, ventasConf, ventasPend, traspasosOut, traspasosIn] = await Promise.all([
              this.prisma.delivery.findMany({
                where: { tenantId, partnerId: partner.id, productId: product.id },
                orderBy: { date: 'asc' },
                select: { id: true, quantity: true, date: true, notes: true },
              }),
              this.prisma.sale.findMany({
                where: { tenantId, partnerId: partner.id, productId: product.id, status: 'CONFIRMED' },
                orderBy: { date: 'asc' },
                select: { id: true, quantity: true, date: true, notes: true, clientType: true },
              }),
              this.prisma.sale.findMany({
                where: { tenantId, partnerId: partner.id, productId: product.id, status: 'PENDING' },
                orderBy: { date: 'asc' },
                select: { id: true, quantity: true, date: true, notes: true, clientType: true },
              }),
              this.prisma.transfer.findMany({
                where: { tenantId, fromPartnerId: partner.id, productId: product.id },
                orderBy: { date: 'asc' },
                include: { toPartner: { select: { name: true } } },
              }),
              this.prisma.transfer.findMany({
                where: { tenantId, toPartnerId: partner.id, productId: product.id },
                orderBy: { date: 'asc' },
                include: { fromPartner: { select: { name: true } } },
              }),
            ]);

            const totalEntregas    = entregas.reduce((s, e) => s + e.quantity, 0);
            const totalVentasConf  = ventasConf.reduce((s, v) => s + v.quantity, 0);
            const totalVentasPend  = ventasPend.reduce((s, v) => s + v.quantity, 0);
            const totalTrOut       = traspasosOut.reduce((s, t) => s + t.quantity, 0);
            const totalTrIn        = traspasosIn.reduce((s, t) => s + t.quantity, 0);
            const disponible       = totalEntregas - totalVentasConf - totalVentasPend - totalTrOut + totalTrIn;

            if (totalEntregas === 0 && totalTrIn === 0) return null;

            const movimientos: any[] = [
              ...entregas.map(e => ({ tipo: 'ENTREGA', fecha: e.date, cantidad: e.quantity, notas: e.notes, contraparte: null })),
              ...ventasConf.map(v => ({ tipo: 'VENTA_CONF', fecha: v.date, cantidad: v.quantity, notas: v.notes, contraparte: v.clientType })),
              ...ventasPend.map(v => ({ tipo: 'VENTA_PEND', fecha: v.date, cantidad: v.quantity, notas: v.notes, contraparte: v.clientType })),
              ...traspasosOut.map(t => ({ tipo: 'TRASPASO_SALIDA', fecha: t.date, cantidad: t.quantity, notas: t.notes, contraparte: t.toPartner.name })),
              ...traspasosIn.map(t => ({ tipo: 'TRASPASO_ENTRADA', fecha: t.date, cantidad: t.quantity, notas: t.notes, contraparte: t.fromPartner.name })),
            ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            return { producto: product, totalEntregas, totalVentasConf, totalVentasPend, totalTrOut, totalTrIn, disponible, movimientos };
          }),
        );

        const productos = productosConActividad.filter(Boolean) as any[];

        const totales = {
          entregas:     productos.reduce((s, p) => s + p.totalEntregas, 0),
          ventasConf:   productos.reduce((s, p) => s + p.totalVentasConf, 0),
          ventasPend:   productos.reduce((s, p) => s + p.totalVentasPend, 0),
          traspasosOut: productos.reduce((s, p) => s + p.totalTrOut, 0),
          traspasosIn:  productos.reduce((s, p) => s + p.totalTrIn, 0),
          disponible:   productos.reduce((s, p) => s + p.disponible, 0),
        };

        return { socio: partner, totales, productos };
      }),
    );

    return { data, error: null, message: null };
  }

  async getInventario(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });

    const data = await Promise.all(
      products.map(async (p) => {
        const entregado = await this.prisma.delivery.aggregate({
          where: { tenantId, productId: p.id },
          _sum: { quantity: true },
        });

        const vendido = await this.prisma.sale.aggregate({
          where: { tenantId, productId: p.id, status: { in: ['CONFIRMED', 'PENDING'] } },
          _sum: { quantity: true },
        });

        const totalEntregado = entregado._sum.quantity || 0;
        const totalVendido = vendido._sum.quantity || 0;
        const disponible = totalEntregado - totalVendido;
        const rotacionPct = totalEntregado > 0 ? (totalVendido / totalEntregado) * 100 : 0;
        const inversionDisponible = disponible * p.costPrice;
        const cajasDisponibles = p.unitsPerBox ? Math.floor(disponible / p.unitsPerBox) : null;
        const bajStock = disponible <= 5;

        return {
          id: p.id,
          nombre: p.name,
          referencia: p.reference,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          unitsPerBox: p.unitsPerBox,
          totalEntregado,
          totalVendido,
          disponible,
          cajasDisponibles,
          rotacionPct: Math.round(rotacionPct * 10) / 10,
          inversionDisponible,
          bajoStock: bajStock,
        };
      }),
    );

    const totales = {
      totalDisponible: data.reduce((acc, d) => acc + d.disponible, 0),
      inversionTotal: data.reduce((acc, d) => acc + d.inversionDisponible, 0),
      productosBajoStock: data.filter((d) => d.bajoStock).length,
    };

    return { data: { productos: data, totales }, error: null, message: null };
  }
}
