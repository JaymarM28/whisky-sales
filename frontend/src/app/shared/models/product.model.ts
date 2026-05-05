export interface Product {
  id: string;
  name: string;
  reference: string;
  unitsPerBox?: number;
  boxCost?: number;
  costPrice: number;
  partnerPrice: number;
  salePrice: number;
  businessPrice: number;
  businessPrice2: number;
  businessPrice3: number;
  active: boolean;
  createdAt: string;
}
