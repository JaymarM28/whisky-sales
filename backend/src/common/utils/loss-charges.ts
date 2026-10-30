type Perdida = { partnerId: string | null; quantity: number; unitCost: number; partnerSharePct: number };

/** Valor de una pérdida al costo del producto cuando se registró. */
export function valorPerdida(p: Perdida): number {
  return p.quantity * p.unitCost;
}

/** Parte del valor que asume el socio; se descuenta de su comisión pendiente. */
export function cargoAlSocio(p: Perdida): number {
  return p.partnerId ? Math.round((valorPerdida(p) * p.partnerSharePct) / 100) : 0;
}

/** Total de cargos por pérdidas agrupado por socio. */
export function cargosPorSocio(perdidas: Perdida[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const p of perdidas) {
    if (!p.partnerId) continue;
    mapa.set(p.partnerId, (mapa.get(p.partnerId) ?? 0) + cargoAlSocio(p));
  }
  return mapa;
}
