import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MovimientosSocio {
  entregado: number;
  vendido: number;
  traspasoSalida: number;
  traspasoEntrada: number;
  devuelto: number;
  disponible: number;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Movimientos de un socio para un producto.
   * disponible = entregado − vendido (confirmadas + pendientes) − traspasado + recibido − devuelto a bodega.
   */
  async getMovimientos(partnerId: string, productId: string, tenantId: string): Promise<MovimientosSocio> {
    const [entregado, vendido, transferOut, transferIn, devuelto] = await Promise.all([
      this.prisma.delivery.aggregate({ where: { tenantId, partnerId, productId }, _sum: { quantity: true } }),
      this.prisma.sale.aggregate({
        where: { tenantId, partnerId, productId, status: { in: ['CONFIRMED', 'PENDING'] } },
        _sum: { quantity: true },
      }),
      this.prisma.transfer.aggregate({ where: { tenantId, fromPartnerId: partnerId, productId }, _sum: { quantity: true } }),
      this.prisma.transfer.aggregate({ where: { tenantId, toPartnerId: partnerId, productId }, _sum: { quantity: true } }),
      this.prisma.stockReturn.aggregate({ where: { tenantId, partnerId, productId }, _sum: { quantity: true } }),
    ]);

    const m = {
      entregado: entregado._sum.quantity || 0,
      vendido: vendido._sum.quantity || 0,
      traspasoSalida: transferOut._sum.quantity || 0,
      traspasoEntrada: transferIn._sum.quantity || 0,
      devuelto: devuelto._sum.quantity || 0,
    };
    return {
      ...m,
      disponible: m.entregado - m.vendido - m.traspasoSalida + m.traspasoEntrada - m.devuelto,
    };
  }

  async getDisponible(partnerId: string, productId: string, tenantId: string): Promise<number> {
    return (await this.getMovimientos(partnerId, productId, tenantId)).disponible;
  }

  /**
   * Movimientos de todos los socios del negocio (o de uno) en 5 consultas agrupadas.
   * Devuelve un mapa por clave `socio|producto`; usar `movimientosDe` para leerlo.
   */
  async getMovimientosNegocio(tenantId: string, partnerId?: string): Promise<Map<string, MovimientosSocio>> {
    const porSocio = partnerId ? { partnerId } : {};
    const [entregas, ventas, salidas, entradas, devoluciones] = await Promise.all([
      this.prisma.delivery.groupBy({ by: ['partnerId', 'productId'], where: { tenantId, ...porSocio }, _sum: { quantity: true } }),
      this.prisma.sale.groupBy({
        by: ['partnerId', 'productId'],
        where: { tenantId, ...porSocio, status: { in: ['CONFIRMED', 'PENDING'] } },
        _sum: { quantity: true },
      }),
      this.prisma.transfer.groupBy({
        by: ['fromPartnerId', 'productId'],
        where: { tenantId, ...(partnerId && { fromPartnerId: partnerId }) },
        _sum: { quantity: true },
      }),
      this.prisma.transfer.groupBy({
        by: ['toPartnerId', 'productId'],
        where: { tenantId, ...(partnerId && { toPartnerId: partnerId }) },
        _sum: { quantity: true },
      }),
      this.prisma.stockReturn.groupBy({ by: ['partnerId', 'productId'], where: { tenantId, ...porSocio }, _sum: { quantity: true } }),
    ]);

    const mapa = new Map<string, MovimientosSocio>();
    const sumar = (socio: string, producto: string, campo: keyof MovimientosSocio, cantidad: number | null) => {
      const clave = `${socio}|${producto}`;
      const m = mapa.get(clave) ?? { entregado: 0, vendido: 0, traspasoSalida: 0, traspasoEntrada: 0, devuelto: 0, disponible: 0 };
      m[campo] += cantidad || 0;
      mapa.set(clave, m);
    };
    entregas.forEach((g) => sumar(g.partnerId, g.productId, 'entregado', g._sum.quantity));
    ventas.forEach((g) => sumar(g.partnerId, g.productId, 'vendido', g._sum.quantity));
    salidas.forEach((g) => sumar(g.fromPartnerId, g.productId, 'traspasoSalida', g._sum.quantity));
    entradas.forEach((g) => sumar(g.toPartnerId, g.productId, 'traspasoEntrada', g._sum.quantity));
    devoluciones.forEach((g) => sumar(g.partnerId, g.productId, 'devuelto', g._sum.quantity));
    for (const m of mapa.values()) {
      m.disponible = m.entregado - m.vendido - m.traspasoSalida + m.traspasoEntrada - m.devuelto;
    }
    return mapa;
  }

  /** Lee del mapa de getMovimientosNegocio; ceros si el socio no tiene movimientos del producto. */
  movimientosDe(mapa: Map<string, MovimientosSocio>, partnerId: string, productId: string): MovimientosSocio {
    return mapa.get(`${partnerId}|${productId}`) ?? { entregado: 0, vendido: 0, traspasoSalida: 0, traspasoEntrada: 0, devuelto: 0, disponible: 0 };
  }

  async getAll(tenantId: string) {
    const [partners, products, mapa] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId, role: 'PARTNER', active: true },
        select: { id: true, name: true },
      }),
      this.prisma.product.findMany({
        where: { tenantId, active: true },
        select: { id: true, name: true, reference: true, salePrice: true, businessPrice: true, businessPrice2: true, businessPrice3: true },
      }),
      this.getMovimientosNegocio(tenantId),
    ]);

    const result = partners.map((partner) => {
      const items = products.map((product) => this.toItem(product, this.movimientosDe(mapa, partner.id, product.id)));
      return { partner, inventory: items.filter((i) => i.totalDelivered > 0 || i.available > 0) };
    });

    return { data: result, error: null, message: null };
  }

  async getByPartner(partnerId: string, tenantId: string) {
    const [products, mapa] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId, active: true },
        select: { id: true, name: true, reference: true, salePrice: true, businessPrice: true, businessPrice2: true, businessPrice3: true },
      }),
      this.getMovimientosNegocio(tenantId, partnerId),
    ]);

    const items = products.map((product) => this.toItem(product, this.movimientosDe(mapa, partnerId, product.id)));

    return {
      data: items.filter((i) => i.totalDelivered > 0 || i.available > 0),
      error: null,
      message: null,
    };
  }

  private toItem<P>(product: P, m: MovimientosSocio) {
    return {
      product,
      totalDelivered: m.entregado,
      totalSold: m.vendido,
      totalReturned: m.devuelto,
      available: m.disponible,
    };
  }
}
