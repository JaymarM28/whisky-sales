export interface StockLoss {
  id: string;
  productId: string;
  product: { id: string; name: string; reference: string };
  /** null = pérdida en bodega */
  partnerId: string | null;
  partner: { id: string; name: string } | null;
  quantity: number;
  unitCost: number;
  partnerSharePct: number;
  /** quantity × unitCost */
  valor: number;
  /** Parte que asume el socio (se descuenta de su comisión) */
  cargoSocio: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ResumenPerdidas {
  unidades: number;
  valor: number;
  asumidoSocios: number;
  asumidoNegocio: number;
}
