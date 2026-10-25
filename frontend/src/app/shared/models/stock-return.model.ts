export interface StockReturn {
  id: string;
  partnerId: string;
  partner: { id: string; name: string };
  productId: string;
  product: { id: string; name: string; reference: string };
  quantity: number;
  date: string;
  notes?: string;
  createdAt: string;
}
