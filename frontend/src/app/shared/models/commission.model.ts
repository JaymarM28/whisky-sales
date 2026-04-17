export interface CommissionPayment {
  id: string;
  partnerId: string;
  partner: { id: string; name: string };
  amount: number;
  paymentReference?: string;
  date: string;
  createdAt: string;
}
