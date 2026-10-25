type VentaConPrecios = {
  clientType: string;
  salePriceSnapshot?: number | null;
  businessPriceSnapshot?: number | null;
  businessPrice2Snapshot?: number | null;
  businessPrice3Snapshot?: number | null;
  product?: { salePrice?: number } | null;
};

/** Precio unitario cobrado según el tipo de cliente, usando los snapshots guardados al reportar la venta. */
export function precioVentaUnitario(sale: VentaConPrecios): number {
  if (sale.clientType === 'BUSINESS' && sale.businessPriceSnapshot) return sale.businessPriceSnapshot;
  if (sale.clientType === 'BUSINESS_2' && sale.businessPrice2Snapshot) return sale.businessPrice2Snapshot;
  if (sale.clientType === 'BUSINESS_3' && sale.businessPrice3Snapshot) return sale.businessPrice3Snapshot;
  return sale.salePriceSnapshot ?? sale.product?.salePrice ?? 0;
}

export function esVentaNegocio(sale: { clientType: string }): boolean {
  return ['BUSINESS', 'BUSINESS_2', 'BUSINESS_3'].includes(sale.clientType);
}
