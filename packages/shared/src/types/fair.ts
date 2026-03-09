import { Customer } from './customer';

export interface Fair {
  id: string;
  name: string;
  address: string;
  startDate: string;
  endDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface FairWithCustomers extends Fair {
  customers: Customer[];
}
