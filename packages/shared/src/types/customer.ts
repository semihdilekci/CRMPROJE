import type { CustomerContact } from './customer-contact';

export interface Customer {
  id: string;
  company: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithContacts extends Customer {
  contacts: CustomerContact[];
}
