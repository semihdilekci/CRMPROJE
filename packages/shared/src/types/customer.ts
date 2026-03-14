export interface Customer {
  id: string;
  company: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}
