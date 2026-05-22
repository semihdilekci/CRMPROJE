export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  cardImage: string | null;
  createdAt: string;
  updatedAt: string;
}
