export interface Purchase {
  id: string;
  productId: string;
  product: { id: string; name: string; reference: string; unitsPerBox?: number };
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ProductStock {
  product: { id: string; name: string; reference: string; unitsPerBox?: number; costPrice: number };
  totalComprado: number;
  totalInvertido: number;
  totalEntregado: number;
  totalDevuelto: number;
  enBodega: number;
}

export interface StockResumen {
  productos: ProductStock[];
  totales: { totalComprado: number; totalInvertido: number; totalEntregado: number; totalDevuelto: number; enBodega: number };
}
