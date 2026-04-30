export type SaleStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';
export type ClientType = 'CONSUMER' | 'BUSINESS';

export interface Sale {
  id: string;
  partnerId: string;
  partner: { id: string; name: string };
  productId: string;
  product: { id: string; name: string; reference: string; salePrice: number; costPrice: number };
  quantity: number;
  date: string;
  receiptImage?: string;
  notes?: string;
  status: SaleStatus;
  clientType: ClientType;
  salePriceSnapshot?: number;
  businessPriceSnapshot?: number;
  createdAt: string;
}
