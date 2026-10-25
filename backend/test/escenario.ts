import { Datos } from './fake-prisma';

/**
 * Escenario de negocio para pruebas. Valores esperados calculados a mano:
 *
 * Producto A: costo 100k · socio 140k · venta 180k · negocio1 160k · negocio2 150k
 * Producto B: costo 50k  · socio 70k  · venta 90k
 *
 * Compras:     A 24 u ($2.400.000) · B 10 u ($500.000)
 * Entregas:    A→P1 12 · A→P2 6 · B→P1 5
 * Traspaso:    P1→P2 A 2
 * Devolución:  P1 A 1 a bodega
 * Ventas:      s1 P1 A 3 CONF consumidor   · s2 P1 A 2 CONF negocio2 · s3 P1 A 1 PEND
 *              s4 P1 B 1 RECH              · s5 P2 A 4 CONF negocio1 · s6 P1 B 2 CONF consumidor
 * Pago comisión: P1 $50.000
 *
 * Stock:   P1 A = 12 − 6 − 2 − 1 = 3 · P1 B = 5 − 2 = 3 · P2 A = 6 − 4 + 2 = 4
 * Bodega:  A = 24 − 18 + 1 = 7 · B = 10 − 5 = 5
 * Comisión P1 (50%): (40k×3 + 10k×2 + 20k×2) × 0,5 = 90.000 (consumidor 80k, negocio 10k)
 * Comisión P2 (20%): 20k×4 × 0,2 = 16.000
 * Ganancia bruta: 80k×3 + 50k×2 + 60k×4 + 40k×2 = 660.000
 */
export const T = 't1';

const fecha = (d: string) => new Date(`2026-10-${d}T12:00:00.000Z`);

const preciosA = {
  costPriceSnapshot: 100_000,
  partnerPriceSnapshot: 140_000,
  salePriceSnapshot: 180_000,
  businessPriceSnapshot: 160_000,
  businessPrice2Snapshot: 150_000,
  businessPrice3Snapshot: 0,
};
const preciosB = {
  costPriceSnapshot: 50_000,
  partnerPriceSnapshot: 70_000,
  salePriceSnapshot: 90_000,
  businessPriceSnapshot: 0,
  businessPrice2Snapshot: 0,
  businessPrice3Snapshot: 0,
};

export function escenario(): Datos {
  return {
    user: [
      { id: 'owner', name: 'Dueño', role: 'OWNER', tenantId: T, active: true, commissionPct: 0, email: 'owner@test.com' },
      { id: 'p1', name: 'Ana', role: 'PARTNER', tenantId: T, active: true, commissionPct: 50, email: 'ana@test.com' },
      { id: 'p2', name: 'Beto', role: 'PARTNER', tenantId: T, active: true, commissionPct: 20, email: null },
      // Otro negocio: nada de esto debe aparecer en T
      { id: 'x1', name: 'Ajeno', role: 'PARTNER', tenantId: 't2', active: true, commissionPct: 50 },
    ],
    product: [
      {
        id: 'A', name: 'Whisky A', reference: 'WA', tenantId: T, active: true, unitsPerBox: 12, boxCost: 1_200_000,
        costPrice: 100_000, partnerPrice: 140_000, salePrice: 180_000, businessPrice: 160_000, businessPrice2: 150_000, businessPrice3: 0,
      },
      {
        id: 'B', name: 'Whisky B', reference: 'WB', tenantId: T, active: true, unitsPerBox: null, boxCost: null,
        costPrice: 50_000, partnerPrice: 70_000, salePrice: 90_000, businessPrice: 0, businessPrice2: 0, businessPrice3: 0,
      },
      {
        id: 'X', name: 'Ajeno', reference: 'XX', tenantId: 't2', active: true,
        costPrice: 1, partnerPrice: 1, salePrice: 1, businessPrice: 0, businessPrice2: 0, businessPrice3: 0,
      },
    ],
    purchase: [
      { id: 'c1', tenantId: T, productId: 'A', quantity: 24, unitCost: 100_000, totalCost: 2_400_000, date: fecha('01') },
      { id: 'c2', tenantId: T, productId: 'B', quantity: 10, unitCost: 50_000, totalCost: 500_000, date: fecha('01') },
      { id: 'cx', tenantId: 't2', productId: 'X', quantity: 99, unitCost: 1, totalCost: 99, date: fecha('01') },
    ],
    delivery: [
      { id: 'd1', tenantId: T, partnerId: 'p1', productId: 'A', quantity: 12, date: fecha('02') },
      { id: 'd2', tenantId: T, partnerId: 'p2', productId: 'A', quantity: 6, date: fecha('02') },
      { id: 'd3', tenantId: T, partnerId: 'p1', productId: 'B', quantity: 5, date: fecha('02') },
      { id: 'dx', tenantId: 't2', partnerId: 'x1', productId: 'X', quantity: 50, date: fecha('02') },
    ],
    transfer: [
      { id: 'tr1', tenantId: T, fromPartnerId: 'p1', toPartnerId: 'p2', productId: 'A', quantity: 2, date: fecha('03') },
    ],
    stockReturn: [
      { id: 'r1', tenantId: T, partnerId: 'p1', productId: 'A', quantity: 1, date: fecha('04') },
    ],
    sale: [
      { id: 's1', tenantId: T, partnerId: 'p1', productId: 'A', quantity: 3, status: 'CONFIRMED', clientType: 'CONSUMER', date: fecha('05'), ...preciosA },
      { id: 's2', tenantId: T, partnerId: 'p1', productId: 'A', quantity: 2, status: 'CONFIRMED', clientType: 'BUSINESS_2', date: fecha('06'), ...preciosA },
      { id: 's3', tenantId: T, partnerId: 'p1', productId: 'A', quantity: 1, status: 'PENDING', clientType: 'CONSUMER', date: fecha('07'), ...preciosA },
      { id: 's4', tenantId: T, partnerId: 'p1', productId: 'B', quantity: 1, status: 'REJECTED', clientType: 'CONSUMER', date: fecha('08'), ...preciosB },
      { id: 's5', tenantId: T, partnerId: 'p2', productId: 'A', quantity: 4, status: 'CONFIRMED', clientType: 'BUSINESS', date: fecha('09'), ...preciosA },
      { id: 's6', tenantId: T, partnerId: 'p1', productId: 'B', quantity: 2, status: 'CONFIRMED', clientType: 'CONSUMER', date: fecha('10'), ...preciosB },
      { id: 'sx', tenantId: 't2', partnerId: 'x1', productId: 'X', quantity: 5, status: 'CONFIRMED', clientType: 'CONSUMER', date: fecha('10'),
        costPriceSnapshot: 1, partnerPriceSnapshot: 1, salePriceSnapshot: 1 },
    ],
    commissionPayment: [
      { id: 'pay1', tenantId: T, partnerId: 'p1', amount: 50_000, date: fecha('11') },
    ],
  };
}
