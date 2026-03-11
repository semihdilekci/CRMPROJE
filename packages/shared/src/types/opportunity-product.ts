export interface OpportunityProduct {
  id: string;
  opportunityId: string;
  productId: string;
  productName: string;
  quantity: number | null;
  unit: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
