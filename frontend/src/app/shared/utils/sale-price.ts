import { Sale } from '../models/sale.model';

/** Precio unitario cobrado según el tipo de cliente, tomado del snapshot guardado al reportar la venta. */
export function precioVentaUnitario(sale: Sale): number {
  if (sale.clientType === 'BUSINESS' && sale.businessPriceSnapshot) return sale.businessPriceSnapshot;
  if (sale.clientType === 'BUSINESS_2' && sale.businessPrice2Snapshot) return sale.businessPrice2Snapshot;
  if (sale.clientType === 'BUSINESS_3' && sale.businessPrice3Snapshot) return sale.businessPrice3Snapshot;
  return sale.salePriceSnapshot ?? sale.product?.salePrice ?? 0;
}
