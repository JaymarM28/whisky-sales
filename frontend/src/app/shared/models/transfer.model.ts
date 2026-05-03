export interface Transfer {
  id: string;
  tenantId: string;
  fromPartnerId: string;
  fromPartner: { id: string; name: string };
  toPartnerId: string;
  toPartner: { id: string; name: string };
  productId: string;
  product: { id: string; name: string; reference: string };
  quantity: number;
  date: string;
  notes?: string;
  createdAt: string;
}
