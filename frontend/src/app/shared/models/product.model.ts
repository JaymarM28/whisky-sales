export interface Product {
  id: string;
  name: string;
  reference: string;
  unitsPerBox?: number;
  boxCost?: number;
  costPrice: number;
  partnerPrice: number;
  salePrice: number;
  active: boolean;
  createdAt: string;
}
