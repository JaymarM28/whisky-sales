import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { precioVentaUnitario, esVentaNegocio } from '../common/utils/sale-price';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getRentabilidad(tenantId: string) {
    const [products, compras] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId },
        include: {
          sales: {
            where: { status: 'CONFIRMED' },
            select: {
              quantity: true,
              clientType: true,
              costPriceSnapshot: true,
              salePriceSnapshot: true,
              businessPriceSnapshot: true,
              businessPrice2Snapshot: true,
              businessPrice3Snapshot: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.purchase.groupBy({
        by: ['productId'],
        where: { tenantId },
        _sum: { quantity: true, totalCost: true },
      }),
    ]);

    const data = products.map((p) => {
      const compra = compras.find((c) => c.productId === p.id);
      const totalComprado = compra?._sum.quantity || 0;
      const totalInvertido = compra?._sum.totalCost || 0;
      // Costo real = promedio de lo pagado en compras; sin compras, el costo del producto
      const costoReal = totalComprado > 0 ? Math.round(totalInvertido / totalComprado) : p.costPrice;

      const totalVendido = p.sales.reduce((acc, s) => acc + s.quantity, 0);
      const ingresos = p.sales.reduce((acc, s) => acc + precioVentaUnitario({ ...s, product: p }) * s.quantity, 0);
      // Cada venta usa el costo vigente cuando se reportó (snapshot)
      const costoVendido = p.sales.reduce((acc, s) => acc + (s.costPriceSnapshot ?? costoReal) * s.quantity, 0);
      const gananciaTotal = ingresos - costoVendido;
      const gananciaPorUnidad = p.salePrice - costoReal;
      const margenPct = costoReal > 0 ? (gananciaPorUnidad / costoReal) * 100 : 0;

      return {
        id: p.id,
        nombre: p.name,
        referencia: p.reference,
        unitsPerBox: p.unitsPerBox,
        costPrice: costoReal,
        salePrice: p.salePrice,
        totalComprado,
        totalInvertido,
        totalVendido,
        ingresos,
        gananciaPorUnidad,
        gananciaTotal,
        margenPct: Math.round(margenPct * 10) / 10,
      };
    });

    const totales = {
      gananciaTotal: data.reduce((acc, d) => acc + d.gananciaTotal, 0),
      totalUnidades: data.reduce((acc, d) => acc + d.totalVendido, 0),
      totalIngresos: data.reduce((acc, d) => acc + d.ingresos, 0),
      totalInvertido: data.reduce((acc, d) => acc + d.totalInvertido, 0),
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

    const precioVenta = (v: any): number => precioVentaUnitario(v);
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
      const idx = esVentaNegocio(v) ? 1 : 0;
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
    const porSocio = { by: ['partnerId'] as ('partnerId')[], _sum: { quantity: true as const } };
    const [partners, entregas, confirmadas, pendientes, salidas, entradas, devoluciones, pagos, ventasConf] = await Promise.all([
      this.prisma.user.findMany({ where: { tenantId, role: 'PARTNER' }, orderBy: { name: 'asc' } }),
      this.prisma.delivery.groupBy({ ...porSocio, where: { tenantId } }),
      this.prisma.sale.groupBy({ ...porSocio, where: { tenantId, status: 'CONFIRMED' } }),
      this.prisma.sale.groupBy({ ...porSocio, where: { tenantId, status: 'PENDING' } }),
      this.prisma.transfer.groupBy({ by: ['fromPartnerId'], where: { tenantId }, _sum: { quantity: true } }),
      this.prisma.transfer.groupBy({ by: ['toPartnerId'], where: { tenantId }, _sum: { quantity: true } }),
      this.prisma.stockReturn.groupBy({ ...porSocio, where: { tenantId } }),
      this.prisma.commissionPayment.groupBy({ by: ['partnerId'], where: { tenantId }, _sum: { amount: true } }),
      this.prisma.sale.findMany({
        where: { tenantId, status: 'CONFIRMED' },
        include: { product: { select: { partnerPrice: true, salePrice: true } } },
      }),
    ]);

    const cantidad = (grupos: { partnerId: string; _sum: { quantity: number | null } }[], id: string) =>
      grupos.find((g) => g.partnerId === id)?._sum.quantity || 0;

    const data = partners.map((partner) => {
      const comisionGenerada = ventasConf
        .filter((sale) => sale.partnerId === partner.id)
        .reduce((acc, sale) => {
          const precio = precioVentaUnitario(sale);
          const precioSocio = sale.partnerPriceSnapshot ?? sale.product.partnerPrice;
          const margen = (precio - precioSocio) * sale.quantity;
          return acc + margen * (partner.commissionPct / 100);
        }, 0);
      const comisionPagada = pagos.find((p) => p.partnerId === partner.id)?._sum.amount || 0;

      const totalEntregado = cantidad(entregas, partner.id);
      const totalVendido = cantidad(confirmadas, partner.id);
      const totalPendiente = cantidad(pendientes, partner.id);
      const totalDevuelto = cantidad(devoluciones, partner.id);
      const trOut = salidas.find((g) => g.fromPartnerId === partner.id)?._sum.quantity || 0;
      const trIn = entradas.find((g) => g.toPartnerId === partner.id)?._sum.quantity || 0;
      const disponible = totalEntregado - totalVendido - totalPendiente - trOut + trIn - totalDevuelto;
      const entregadoNeto = totalEntregado - totalDevuelto;
      const rendimientoPct = entregadoNeto > 0 ? (totalVendido / entregadoNeto) * 100 : 0;

      return {
        id: partner.id,
        nombre: partner.name,
        activo: partner.active,
        commissionPct: partner.commissionPct,
        totalEntregado,
        totalVendido,
        totalPendiente,
        totalDevuelto,
        disponible,
        rendimientoPct: Math.round(rendimientoPct * 10) / 10,
        comisionGenerada: Math.round(comisionGenerada),
        comisionPagada,
        comisionPendiente: Math.round(comisionGenerada) - comisionPagada,
      };
    });

    return { data, error: null, message: null };
  }

  async getInventarioPorSocio(tenantId: string) {
    const porFecha = { orderBy: { date: 'asc' as const } };
    const [partners, products, entregas, ventas, traspasos, devoluciones] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId, role: 'PARTNER' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, active: true },
      }),
      this.prisma.product.findMany({
        where: { tenantId },
        select: { id: true, name: true, reference: true },
      }),
      this.prisma.delivery.findMany({ where: { tenantId }, ...porFecha }),
      this.prisma.sale.findMany({ where: { tenantId, status: { in: ['CONFIRMED', 'PENDING'] } }, ...porFecha }),
      this.prisma.transfer.findMany({
        where: { tenantId },
        ...porFecha,
        include: { fromPartner: { select: { name: true } }, toPartner: { select: { name: true } } },
      }),
      this.prisma.stockReturn.findMany({ where: { tenantId }, ...porFecha }),
    ]);

    const suma = (rows: { quantity: number }[]) => rows.reduce((s, r) => s + r.quantity, 0);

    const data = partners.map((partner) => {
      const productosConActividad = products.map((product) => {
        const delProducto = <R extends { productId: string }>(rows: R[]) => rows.filter((r) => r.productId === product.id);
        const ent = delProducto(entregas).filter((e) => e.partnerId === partner.id);
        const ventasSocio = delProducto(ventas).filter((v) => v.partnerId === partner.id);
        const ventasConf = ventasSocio.filter((v) => v.status === 'CONFIRMED');
        const ventasPend = ventasSocio.filter((v) => v.status === 'PENDING');
        const traspasosOut = delProducto(traspasos).filter((t) => t.fromPartnerId === partner.id);
        const traspasosIn = delProducto(traspasos).filter((t) => t.toPartnerId === partner.id);
        const dev = delProducto(devoluciones).filter((d) => d.partnerId === partner.id);

        const totalEntregas    = suma(ent);
        const totalVentasConf  = suma(ventasConf);
        const totalVentasPend  = suma(ventasPend);
        const totalTrOut       = suma(traspasosOut);
        const totalTrIn        = suma(traspasosIn);
        const totalDevuelto    = suma(dev);
        const disponible       = totalEntregas - totalVentasConf - totalVentasPend - totalTrOut + totalTrIn - totalDevuelto;

        if (totalEntregas === 0 && totalTrIn === 0) return null;

        const movimientos: any[] = [
          ...ent.map(e => ({ tipo: 'ENTREGA', fecha: e.date, cantidad: e.quantity, notas: e.notes, contraparte: null })),
          ...ventasConf.map(v => ({ tipo: 'VENTA_CONF', fecha: v.date, cantidad: v.quantity, notas: v.notes, contraparte: v.clientType })),
          ...ventasPend.map(v => ({ tipo: 'VENTA_PEND', fecha: v.date, cantidad: v.quantity, notas: v.notes, contraparte: v.clientType })),
          ...traspasosOut.map(t => ({ tipo: 'TRASPASO_SALIDA', fecha: t.date, cantidad: t.quantity, notas: t.notes, contraparte: t.toPartner.name })),
          ...traspasosIn.map(t => ({ tipo: 'TRASPASO_ENTRADA', fecha: t.date, cantidad: t.quantity, notas: t.notes, contraparte: t.fromPartner.name })),
          ...dev.map(d => ({ tipo: 'DEVOLUCION', fecha: d.date, cantidad: d.quantity, notas: d.notes, contraparte: null })),
        ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        return { producto: product, totalEntregas, totalVentasConf, totalVentasPend, totalTrOut, totalTrIn, totalDevuelto, disponible, movimientos };
      });

      const productos = productosConActividad.filter(Boolean) as any[];

      const totales = {
        entregas:     productos.reduce((s, p) => s + p.totalEntregas, 0),
        ventasConf:   productos.reduce((s, p) => s + p.totalVentasConf, 0),
        ventasPend:   productos.reduce((s, p) => s + p.totalVentasPend, 0),
        traspasosOut: productos.reduce((s, p) => s + p.totalTrOut, 0),
        traspasosIn:  productos.reduce((s, p) => s + p.totalTrIn, 0),
        devoluciones: productos.reduce((s, p) => s + p.totalDevuelto, 0),
        disponible:   productos.reduce((s, p) => s + p.disponible, 0),
      };

      return { socio: partner, totales, productos };
    });

    return { data, error: null, message: null };
  }

  async getInventario(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });

    const porProducto = { by: ['productId'] as ('productId')[] };
    const [compras, entregas, ventas, devoluciones] = await Promise.all([
      this.prisma.purchase.groupBy({ ...porProducto, where: { tenantId }, _sum: { quantity: true, totalCost: true } }),
      this.prisma.delivery.groupBy({ ...porProducto, where: { tenantId }, _sum: { quantity: true } }),
      this.prisma.sale.groupBy({
        ...porProducto,
        where: { tenantId, status: { in: ['CONFIRMED', 'PENDING'] } },
        _sum: { quantity: true },
      }),
      this.prisma.stockReturn.groupBy({ ...porProducto, where: { tenantId }, _sum: { quantity: true } }),
    ]);
    const delProducto = <G extends { productId: string }>(grupos: G[], id: string) => grupos.find((g) => g.productId === id);

    const data = products.map((p) => {
      const comprado = delProducto(compras, p.id) ?? { _sum: { quantity: 0, totalCost: 0 } };
      const entregado = delProducto(entregas, p.id) ?? { _sum: { quantity: 0 } };
      const vendido = delProducto(ventas, p.id) ?? { _sum: { quantity: 0 } };
      const devuelto = delProducto(devoluciones, p.id) ?? { _sum: { quantity: 0 } };

      const totalComprado = comprado._sum.quantity || 0;
      const totalInvertido = comprado._sum.totalCost || 0;
      const totalEntregado = entregado._sum.quantity || 0;
      const totalVendido = vendido._sum.quantity || 0;
      const totalDevuelto = devuelto._sum.quantity || 0;
      const enBodega = totalComprado - totalEntregado + totalDevuelto;
      const enSocios = totalEntregado - totalVendido - totalDevuelto;
      const disponible = enBodega + enSocios;
      const rotacionPct = totalComprado > 0 ? (totalVendido / totalComprado) * 100 : 0;
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
        totalComprado,
        totalInvertido,
        totalEntregado,
        totalVendido,
        enBodega,
        enSocios,
        disponible,
        cajasDisponibles,
        rotacionPct: Math.round(rotacionPct * 10) / 10,
        inversionDisponible,
        bajoStock: bajStock,
      };
    });

    const totales = {
      totalDisponible: data.reduce((acc, d) => acc + d.disponible, 0),
      totalEnBodega: data.reduce((acc, d) => acc + d.enBodega, 0),
      totalEnSocios: data.reduce((acc, d) => acc + d.enSocios, 0),
      totalInvertido: data.reduce((acc, d) => acc + d.totalInvertido, 0),
      inversionTotal: data.reduce((acc, d) => acc + d.inversionDisponible, 0),
      productosBajoStock: data.filter((d) => d.bajoStock).length,
    };

    return { data: { productos: data, totales }, error: null, message: null };
  }
}
